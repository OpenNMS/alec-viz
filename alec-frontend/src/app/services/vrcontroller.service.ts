/*

MIT License

Copyright © 2017 Stewart Smith.

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
 */
import {Injectable} from '@angular/core';
import {EventManager} from '@angular/platform-browser';
import * as THREE from 'three';
import {Intersection, Object3D} from 'three';

/**
 * Conversion of THREE.VRController to Typescript.
 * See https://github.com/stewdio/THREE.VRController
 */
@Injectable({
  providedIn: 'root'
})
export class VRControllerService {

  public controller: THREE.Object3D;
  public thumbpad: GamepadButton;
  public trigger: GamepadButton;
  public armModel = new OrientationArmModel();
  private camera: THREE.Camera;
  private controllerQ = new THREE.Quaternion();

  constructor(private eventManager: EventManager) {
    this.controller = new THREE.Object3D();
    this.controller.matrixAutoUpdate = false;

    const meshColorOff = 0xDB3236; //  Red.
    const meshColorOn  = 0xF4C20D; //  Yellow.
    const controllerMaterial = new THREE.MeshStandardMaterial({
      color: meshColorOff
    });
    const multiplier = 2;
    const controllerMesh = new THREE.Mesh(
      new THREE.CylinderGeometry( multiplier * 0.005, multiplier * 0.05, multiplier * 0.1, 6 ),
      controllerMaterial
    );
    const handleMesh = new THREE.Mesh(
      new THREE.BoxGeometry( multiplier * 0.03, multiplier * 0.1, multiplier * 0.03 ),
      controllerMaterial
    );
    controllerMaterial.flatShading = true;
    controllerMesh.rotation.x = -Math.PI / 2;
    handleMesh.position.y = -0.05;
    controllerMesh.add( handleMesh );
    this.controller.userData.mesh = controllerMesh; //  So we can change the color later.
    this.controller.add( controllerMesh );

    this.eventManager.addGlobalEventListener('window', 'gamepadconnected', (e: any) => {
      this.onGamepadConnected(e);
    });
    this.eventManager.addGlobalEventListener('window', 'gamepaddisconnected', (e: any) => {
      this.onGamepadDisconnected(e);
    });
  }

  public setCamera(camera: THREE.Camera) {
    this.camera = camera;
  }

  public pollForChanges() {
    const gamepads = navigator.getGamepads();
    if (gamepads.length < 1 || gamepads[0] === null) {
      return;
    }

    const gamepad = gamepads[0];
    const gamepadPose = gamepad.pose;
    const currentOrientation = <any>gamepadPose.orientation;
    if (currentOrientation !== null) {
      this.controllerQ.fromArray(<number[]>currentOrientation);
    }

    gamepad.buttons.forEach( (gamepadButton, i) => {
      if (i === 0) {
        this.thumbpad = gamepadButton;
      } else if (i === 1) {
        this.trigger = gamepadButton;
      }
    });

    this.armModel.setHeadPosition(this.camera.position);
    this.armModel.setHeadOrientation(this.camera.quaternion);
    this.armModel.setControllerOrientation(this.controllerQ);
    this.armModel.update();

    this.controller.matrix.compose(
      this.armModel.pose.position,
      this.armModel.pose.orientation,
      this.controller.scale
    );
  }

  private onGamepadConnected(event: any) {
    console.log('gamepadconnected: ' + event);
    this.reportGamepads();
  }

  private onGamepadDisconnected(event: any) {
    console.log('onGamepadDisconnected: ' + event);
    this.reportGamepads();
  }

  public reportGamepads() {
    const gamepads = navigator.getGamepads();
    console.log(gamepads.length + ' controllers');
    for (let i = 0; i < gamepads.length; ++i) {
      const gp = gamepads[i];
      console.log('gamepad', gp);
    }
  }

  public raycast(objects: Object3D[], position: THREE.Vector3): Intersection[] {
    const tMatrix = new THREE.Matrix4();
    const tDirection = new THREE.Vector3( 0, 1, 0 );
    const raycast = new THREE.Raycaster( new THREE.Vector3(), new THREE.Vector3() );

    this.controller.updateMatrixWorld(false);
    tMatrix.identity().extractRotation( this.controller.matrixWorld );
    tDirection.set(0, 1, 0).applyMatrix4( tMatrix ).normalize();
    raycast.set(position, tDirection);

    return raycast.intersectObjects(objects, false);
  }
}

export class Pose {
  public orientation = new THREE.Quaternion();
  public position = new THREE.Vector3();
}

/**
 * Copied from https://github.com/stewdio/THREE.VRController/blob/master/VRController.js
 */
export class OrientationArmModel {

  static HEAD_ELBOW_OFFSET = new THREE.Vector3(  0.155, -0.465, -0.15 );
  static ELBOW_WRIST_OFFSET = new THREE.Vector3(  0, 0, -0.25 );
  static WRIST_CONTROLLER_OFFSET = new THREE.Vector3(  0, 0, 0.05 );
  static ARM_EXTENSION_OFFSET = new THREE.Vector3( -0.08, 0.14, 0.08 );
  static ELBOW_BEND_RATIO = 0.4; //  40% elbow, 60% wrist.
  static EXTENSION_RATIO_WEIGHT = 0.4;
  static MIN_ANGULAR_SPEED = 0.61; //  35˚ per second, converted to radians.

  private isLeftHanded = false;
  //  Current and previous controller orientations.
  private controllerQ =  new THREE.Quaternion();
  private lastControllerQ = new THREE.Quaternion();
  //  Current and previous head orientations.
  private headQ = new THREE.Quaternion();
  //  Current head position.
  private headPos = new THREE.Vector3();
  // Positions of other joints (mostly for debugging).
  private elbowPos = new THREE.Vector3();
  private wristPos = new THREE.Vector3();
  //  Current and previous times the model was updated.
  private time: number;
  private lastTime: number;
  // Root rotation
  private rootQ = new THREE.Quaternion();
  //  Current pose that this arm model calculates.
  public pose = new Pose();

  public setControllerOrientation(quaternion: THREE.Quaternion) {
    this.lastControllerQ.copy( this.controllerQ );
    this.controllerQ.copy( quaternion );
  }

  public setHeadOrientation(quaternion: THREE.Quaternion) {
    this.headQ.copy( quaternion );
  }

  public setHeadPosition(position: THREE.Vector3) {
    this.headPos.copy( position );
  }

  public setLeftHanded (isLeftHanded: boolean) {
    this.isLeftHanded = isLeftHanded;
  }

  public update() {
    this.time = performance.now();


    //  If the controller’s angular velocity is above a certain amount,
    //  we can assume torso rotation and move the elbow joint relative
    //  to the camera orientation.

    const
      headYawQ = this.getHeadYawOrientation_(),
      timeDelta = (this.time - this.lastTime) / 1000,
      angleDelta = this.quatAngle_( this.lastControllerQ, this.controllerQ ),
      controllerAngularSpeed = angleDelta / timeDelta;

    if ( controllerAngularSpeed > OrientationArmModel.MIN_ANGULAR_SPEED ) {

      this.rootQ.slerp( headYawQ, angleDelta / 10 ); // Attenuate the Root rotation slightly.
    } else {
      this.rootQ.copy( headYawQ );
    }


    // We want to move the elbow up and to the center as the user points the
    // controller upwards, so that they can easily see the controller and its
    // tool tips.
    const controllerEuler = new THREE.Euler().setFromQuaternion(this.controllerQ, 'YXZ');
    const controllerXDeg = THREE.Math.radToDeg(controllerEuler.x);
    const extensionRatio = this.clamp_((controllerXDeg - 11) / (50 - 11), 0, 1);

    // Controller orientation in camera space.
    const controllerCameraQ = this.rootQ.clone().inverse();
    controllerCameraQ.multiply(this.controllerQ);

    // Calculate elbow position.
    const elbowPos = this.elbowPos;
    elbowPos.copy(this.headPos).add(OrientationArmModel.HEAD_ELBOW_OFFSET);
    const elbowOffset = new THREE.Vector3().copy(OrientationArmModel.ARM_EXTENSION_OFFSET);
    elbowOffset.multiplyScalar(extensionRatio);
    elbowPos.add(elbowOffset);

    // Calculate joint angles. Generally 40% of rotation applied to elbow, 60%
    // to wrist, but if controller is raised higher, more rotation comes from
    // the wrist.
    const totalAngle = this.quatAngle_(controllerCameraQ, new THREE.Quaternion());
    const totalAngleDeg = THREE.Math.radToDeg(totalAngle);
    const lerpSuppression = 1 - Math.pow(totalAngleDeg / 180, 4); // TODO(smus): ???

    const elbowRatio = OrientationArmModel.ELBOW_BEND_RATIO;
    const wristRatio = 1 - OrientationArmModel.ELBOW_BEND_RATIO;
    const lerpValue = lerpSuppression *
      (elbowRatio + wristRatio * extensionRatio * OrientationArmModel.EXTENSION_RATIO_WEIGHT);

    const wristQ = new THREE.Quaternion().slerp(controllerCameraQ, lerpValue);
    const invWristQ = wristQ.inverse();
    const elbowQ = controllerCameraQ.clone().multiply(invWristQ);

    // Calculate our final controller position based on all our joint rotations
    // and lengths.
    /*
      position_ =
          root_rot_ * (
              controller_root_offset_ +
  2:      (arm_extension_ * amt_extension) +
  1:      elbow_rot * (kControllerForearm + (wrist_rot * kControllerPosition))
          );
      */
    const wristPos = this.wristPos;
    wristPos.copy(OrientationArmModel.WRIST_CONTROLLER_OFFSET);
    wristPos.applyQuaternion(wristQ);
    wristPos.add(OrientationArmModel.ELBOW_WRIST_OFFSET);
    wristPos.applyQuaternion(elbowQ);
    wristPos.add(this.elbowPos);

    const offset = new THREE.Vector3().copy(OrientationArmModel.ARM_EXTENSION_OFFSET);
    offset.multiplyScalar(extensionRatio);

    const position = new THREE.Vector3().copy(this.wristPos);
    position.add(offset);
    position.applyQuaternion(this.rootQ);

    const orientation = new THREE.Quaternion().copy(this.controllerQ);

    //  Set the resulting pose orientation and position.

    this.pose.orientation.copy( orientation );
    this.pose.position.copy( position );

    this.lastTime = this.time;
  }

  private getForearmLength() {
    return OrientationArmModel.ELBOW_WRIST_OFFSET.length();
  }

  private getElbowPosition() {
    const out = this.elbowPos.clone();
    return out.applyQuaternion( this.rootQ );
  }

  private getWristPosition() {
    const out = this.wristPos.clone();
    return out.applyQuaternion( this.rootQ );
  }

  private getHeadYawOrientation_() {
    const headEuler = new THREE.Euler().setFromQuaternion( this.headQ, 'YXZ' );
    headEuler.x  = 0;
    headEuler.z  = 0;
    return new THREE.Quaternion().setFromEuler( headEuler );
  }

  private clamp_( value, min, max ) {
    return Math.min( Math.max( value, min ), max );
  }

  private quatAngle_( q1, q2 ) {
    const vec1 = new THREE.Vector3( 0, 0, -1 );
    const vec2 = new THREE.Vector3( 0, 0, -1 );
    vec1.applyQuaternion( q1 );
    vec2.applyQuaternion( q2 );
    return vec1.angleTo( vec2 );
  }
}
