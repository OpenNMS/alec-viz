import * as THREE from 'three';
import TWEEN from '@tweenjs/tween.js';
import Easing from '@tweenjs/tween.js';
import {Edge} from '../services/model.service';
import {Endpoint} from './endpoint';
import {Observable} from 'rxjs/internal/Observable';

export interface EndpointLink {
  group: THREE.Group;
  trackEndpoints();
  onSteadyState();
}

export class SimpleLineEndpointLink implements EndpointLink {
  geometry = new THREE.Geometry();
  group = new THREE.Group();

  // Used by D3-force
  source: any;
  target: any;

  constructor(private edge: Edge, private sourceEndpoint: Endpoint, private targetEndpoint: Endpoint) {
    this.source = edge.source_id;
    this.target = edge.target_id;

    // Create a new "link" for the edge and add it to the scene
    this.geometry.vertices.push(sourceEndpoint.group.position.clone());
    this.geometry.vertices.push(targetEndpoint.group.position.clone());
    const line_material = new THREE.LineDashedMaterial({
      color: 0xff00ff,
      linewidth: 2,
      scale: 1,
      dashSize: 3,
      gapSize: 10,
    });
    const line = new THREE.Line(this.geometry, line_material);

    this.group.add(line);
  }

  trackEndpoints() {
    const sourceVertex = this.geometry.vertices[0];
    const targetVertex = this.geometry.vertices[1];

    sourceVertex.x = this.source.x;
    sourceVertex.y = this.source.y;
    targetVertex.x = this.target.x;
    targetVertex.y = this.target.y;

    this.geometry.verticesNeedUpdate = true;
  }

  onSteadyState() {
    // pass
  }

}

export class HybridEndpointLink implements EndpointLink {
  geometry = new THREE.Geometry();
  group = new THREE.Group();

  // Cylinder tracking
  cylinderPresent = false;
  curve: THREE.Curve<THREE.Vector3>;

  // Used by D3-force
  source: any;
  target: any;

  constructor(private edge: Edge, private sourceEndpoint: Endpoint, private targetEndpoint: Endpoint) {
    this.source = edge.source_id;
    this.target = edge.target_id;

    // Create a new "link" for the edge and add it to the scene
    this.geometry.vertices.push(sourceEndpoint.group.position.clone());
    this.geometry.vertices.push(targetEndpoint.group.position.clone());
    this.createLine();
  }

  trackEndpoints() {
    if (this.cylinderPresent) {
      // Delete the cylinder and add the line back
      this.group.children.forEach(c => this.group.remove(c));
      this.createLine();
      this.cylinderPresent = false;
    }
    const sourceVertex = this.geometry.vertices[0];
    const targetVertex = this.geometry.vertices[1];

    sourceVertex.x = this.source.x;
    sourceVertex.y = this.source.y;
    targetVertex.x = this.target.x;
    targetVertex.y = this.target.y;

    this.geometry.verticesNeedUpdate = true;
  }

  onSteadyState() {
    this.createCylinder();
    this.cylinderPresent = true;
  }

  private createCylinder() {
    const sourcePos = this.sourceEndpoint.group.position;
    const targetPos = this.targetEndpoint.group.position;

    this.group.children.forEach(c => this.group.remove(c));

    const LineCurve = function() {
      THREE.Curve.call( this );
    };
    LineCurve.prototype = Object.create( THREE.Curve.prototype );
    LineCurve.prototype.constructor = LineCurve;
    LineCurve.prototype.getPoint = function ( t ) {
      const x = (1 - t) * sourcePos.x + (t) * targetPos.x;
      const y = (1 - t) * sourcePos.y + (t) * targetPos.y;
      const z = (1 - t) * sourcePos.z + (t) * targetPos.z;
      return new THREE.Vector3(x, y, z);
    };
    this.curve = new LineCurve();

    const material = new THREE.MeshLambertMaterial( { color: 0xff00ff } );
    const tubeGeometry = new THREE.TubeBufferGeometry( this.curve, 8, 1, 4, false );
    const mesh = new THREE.Mesh( tubeGeometry, material );
    this.group.add(mesh);
  }

  private createLine() {
    const line_material = new THREE.LineDashedMaterial({
      color: 0xff00ff,
      linewidth: 2,
      scale: 1,
      dashSize: 3,
      gapSize: 10,
    });
    const line = new THREE.Line(this.geometry, line_material);
    this.group.add(line);
  }
}

/**
 * Nice, but expensive!
 */
export class TubeEndpointLink implements EndpointLink {
  group = new THREE.Group();
  curveGroup = new THREE.Group();
  curve: THREE.Curve<THREE.Vector3>;

  // Used by D3-force
  source: any;
  target: any;

  constructor(private edge: Edge, private sourceEndpoint: Endpoint, private targetEndpoint: Endpoint) {
    this.source = edge.source_id;
    this.target = edge.target_id;

    this.group.add(this.curveGroup);

    this.trackEndpoints();
  }

  trackEndpoints() {
    const sourcePos = this.sourceEndpoint.group.position;
    const targetPos = this.targetEndpoint.group.position;

    this.curveGroup.children.forEach(c => this.curveGroup.remove(c));

    const LineCurve = function() {
      THREE.Curve.call( this );
    };
    LineCurve.prototype = Object.create( THREE.Curve.prototype );
    LineCurve.prototype.constructor = LineCurve;
    LineCurve.prototype.getPoint = function ( t ) {
      const x = (1 - t) * sourcePos.x + (t) * targetPos.x;
      const y = (1 - t) * sourcePos.y + (t) * targetPos.y;
      const z = (1 - t) * sourcePos.z + (t) * targetPos.z;
      return new THREE.Vector3(x, y, z);
    };
    this.curve = new LineCurve();

    const material = new THREE.MeshLambertMaterial( { color: 0xff00ff } );
    const tubeGeometry = new THREE.TubeBufferGeometry( this.curve, 1, 1, 1, false );
    const mesh = new THREE.Mesh( tubeGeometry, material );
    this.curveGroup.add(mesh);
  }

  onSteadyState() {
    // pass
  }
}

export class LinkUsage {
  public inUsagePercent;
  public outUsagePercent;
}

export class TwisterPairEndpointLink implements EndpointLink {
  group = new THREE.Group();
  curveGroup = new THREE.Group();
  linkUsageGroup = new THREE.Group();
  curveIngress: THREE.Curve<THREE.Vector3>;
  curveEgress: THREE.Curve<THREE.Vector3>;

  private lastLength: number;

  // Used by D3-force
  source: any;
  target: any;

  private lastLinkUsage: LinkUsage;

  private animationTimerId: any;
  private numActiveIngressSpheres = 0;
  private numActiveEgressSpheres = 0;

  constructor(private edge: Edge,
              private sourceEndpoint: Endpoint,
              private targetEndpoint: Endpoint,
              private linkUsage$: Observable<LinkUsage>) {
    this.source = edge.source_id;
    this.target = edge.target_id;

    this.group.add(this.curveGroup);
    this.group.add(this.linkUsageGroup);

    this.trackEndpoints();

    if (this.linkUsage$) {
      // FIXME: Memory leeeeak
      this.linkUsage$.subscribe((linkUsage: LinkUsage) => {
        this.onLinkUsageChanged(linkUsage);
      });
    }
  }

  trackEndpoints() {
    const sourcePos = this.sourceEndpoint.group.position;
    const targetPos = this.targetEndpoint.group.position;

    // Calculate the length of the link
    const line = new THREE.Line3(sourcePos, targetPos);
    const length = line.distance();

    if (this.lastLength === undefined || Math.abs(this.lastLength - length) > 0.1) {
      // Only update the curve geometries of the length has changed, since it is expensive
      this.curveGroup.children.forEach(c => this.curveGroup.remove(c));
      this.curveIngress = this.addCurve(length, 0, 0xff00ff);
      this.curveEgress = this.addCurve(length, Math.PI, 0xffccff);
      this.lastLength = length;
    }

    this.curveGroup.position.set(sourcePos.x, sourcePos.y, sourcePos.z);
    this.curveGroup.lookAt(targetPos);
  }

  private addCurve(length: number, offset: number, color: number): THREE.Curve<THREE.Vector3> {
    const HelixCurve = function() {
      THREE.Curve.call( this );
    };
    HelixCurve.prototype = Object.create( THREE.Curve.prototype );
    HelixCurve.prototype.constructor = HelixCurve;
    HelixCurve.prototype.getPoint = function ( t ) {
      const a = 2; // radius
      const b = length;
      const t2 = 6 * Math.PI * t * b / 30 + offset;
      const x = Math.cos( t2 ) * a;
      const y = Math.sin( t2 ) * a;
      const z = b * t;
      return new THREE.Vector3(x, y, z);
    };
    const curve = new HelixCurve();

    const material = new THREE.MeshLambertMaterial( { color: color } );
    const tubeGeometry = new THREE.TubeBufferGeometry( curve, 24, 1, 8, false );
    const mesh = new THREE.Mesh( tubeGeometry, material );
    this.curveGroup.add(mesh);
    return curve;
  }

  private onLinkUsageChanged(linkUsage: LinkUsage) {
    if (this.lastLinkUsage === undefined) {
      this.lastLinkUsage = linkUsage;
      this.startAnimatingLinkUsage();
    }
  }

  private startAnimatingLinkUsage() {
    // Create a time that runs every 50ms and spawns new spheres
    // at a rate proportional to the link usage
    this.animationTimerId = setInterval(() => {
      const time = 2500 * Math.max(this.lastLength / 60, 1);

      const targetNumIngressSpheres = Math.min(this.lastLinkUsage.inUsagePercent / 2, this.lastLength / 1.5 );
      const numIngressSpheresToSpawn = targetNumIngressSpheres - this.numActiveIngressSpheres;
      if (numIngressSpheresToSpawn > 0) {
        this.numActiveIngressSpheres++;
        this.doAnimateLink(() => this.curveIngress, 0, 1, 0xff0000, false, time, () => {
          this.numActiveIngressSpheres--;
        });
      }

      const targetNumEgressSpheres = Math.min(this.lastLinkUsage.outUsagePercent / 2, this.lastLength / 1.5 );
      const numEgressSpheresToSpawn = targetNumEgressSpheres - this.numActiveEgressSpheres;
      if (numEgressSpheresToSpawn > 0) {
        this.numActiveEgressSpheres++;
        this.doAnimateLink(() => this.curveEgress, 1, 0, 0x00ff00, false, time, () => {
          this.numActiveEgressSpheres--;
        });
      }
    }, 100);
  }

  private stopAnimatingLinkUsage() {
    if (this.animationTimerId !== undefined) {
      clearInterval(this.animationTimerId);
      this.animationTimerId = undefined;
    }
  }

  private doAnimateLink(getCurve: () => THREE.Curve<THREE.Vector3>, t0: number, t1: number, color: number, restart: boolean, time: number, onComplete: () => void) {
    const geometry = new THREE.SphereBufferGeometry( 2, 8, 8 );
    const material = new THREE.MeshLambertMaterial( {color: color} );
    const sphere = new THREE.Mesh( geometry, material );
    let v0 = getCurve().getPoint(t0);
    v0 = this.curveGroup.localToWorld(v0);
    sphere.position.set(v0.x, v0.y, v0.z);
    this.linkUsageGroup.add(sphere);

    const position = {x: t0};
    new TWEEN.Tween( position ).to( {x: t1}, time)
      .easing(Easing.Quadratic.In)
      .onUpdate(() => {
        let pos = getCurve().getPoint(position.x);
        pos = this.curveGroup.localToWorld(pos);
        sphere.position.set(pos.x, pos.y, pos.z);
      })
      .onComplete(() => {
        onComplete();
        this.linkUsageGroup.remove(sphere);
      })
      .start();
  }

  onSteadyState() {
    // pass
  }
}
