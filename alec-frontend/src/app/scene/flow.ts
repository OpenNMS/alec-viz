import * as THREE from 'three';
import TWEEN from '@tweenjs/tween.js';
import Easing from '@tweenjs/tween.js';
import {Endpoint} from './endpoint';

export class Flow {

  private geometry: THREE.BufferGeometry;
  private material: THREE.Material;
  private mesh: THREE.Mesh;
  private animationComplete: boolean;
  group: THREE.Group;

  endpointA: Endpoint;
  endpointZ: Endpoint;

  constructor(endpointA: Endpoint, endpointZ: Endpoint, scale: number) {
    this.endpointA = endpointA;
    this.endpointZ = endpointZ;

    this.geometry = new THREE.CylinderBufferGeometry( scale, scale, 2 * scale, 32 );
    this.material = new THREE.MeshLambertMaterial( {color: 0x97FF08} );
    this.mesh = new THREE.Mesh( this.geometry, this.material );

    this.group = new THREE.Group();
    this.group.position.copy(endpointA.group.position);
    this.group.add( this.mesh );
  }

  public start(): void {
    const self = this;

    new TWEEN.Tween( this.group.position ).to( {
      x: this.endpointZ.group.position.x,
      y: this.endpointZ.group.position.y,
      z: this.endpointZ.group.position.z}, 1000 )
      .easing(TWEEN.Easing.Quadratic.In)
      .onUpdate(() => {
        // Adjust the angle of the object to "look at" the target
        this.group.lookAt(this.endpointZ.group.position);
      })
      .onComplete(() => {
        self.animationComplete = true;
      })
      .start();
  }

  public isDone(): boolean {
    return this.animationComplete;
  }
}
