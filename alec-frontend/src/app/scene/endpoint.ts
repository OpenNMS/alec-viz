import * as THREE from 'three';
// import {ColladaModel, Font} from 'three';
import {Vertex} from '../services/model.service';
import TWEEN from '@tweenjs/tween.js';
import Easing from '@tweenjs/tween.js';
import {MeasurementService} from '../services/measurement.service';

export interface MyUserData {
  endpointId: any;
}

export class Endpoint {

  private geometry: THREE.Geometry;
  private material: THREE.Material;
  private mesh: THREE.Mesh;
  private userData: MyUserData;

  // Focus handling
  private focusObject: THREE.Object3D;
  private focusTween: TWEEN;

  group: THREE.Group;
  id: any;

  // Set by D3-force
  x: number;
  y: number;

  constructor(public vertex: Vertex,
              private measurementService: MeasurementService,
              private font: Font) {
    this.id = vertex.id;
    this.userData = {'endpointId': this.id};

    this.group = new THREE.Group();
    this.group.userData = this.userData;

    let createMesh = false;
    if (vertex.type === 'alarm' || vertex.type === 'situation') {
      let multiplier = 1;
      if (vertex.type === 'situation') {
        // Make the situations bigger
        multiplier = 2;
      }
      this.geometry = new THREE.DodecahedronGeometry(6 * multiplier, 0);
      createMesh = true;
    } else {
      this.geometry = new THREE.BoxGeometry( 12, 12, 12 );
      createMesh = true;
    }

    if (createMesh) {
      this.material = this.getMaterial(vertex);
      this.mesh = new THREE.Mesh( this.geometry, this.material );
      this.mesh.userData = this.userData;
      this.group.add( this.mesh );
    }

    if (vertex.layer_id === 'inventory' && font !== null) {
        const textGeo = new THREE.TextGeometry( vertex.label, {
          font: font,
          size: 3,
          height: 1,
          curveSegments: 6
        } );
        const material = new THREE.MeshBasicMaterial( {color: 0x0, side: THREE.DoubleSide} );
        const textMesh = new THREE.Mesh( textGeo, material );
        const box = new THREE.Box3().setFromObject( textMesh );
        textMesh.position.set(-box.getSize().x / 2, 0, -15);
        textMesh.rotateX(Math.PI / 2);
        this.group.add( textMesh );
    }

    this.addKPIs();
  }

  private visitObjectRecursively(object: THREE.Object3D, callback: (this: void, object: THREE.Object3D) => void) {
    callback(object);
    object.children.forEach(obj => {
      this.visitObjectRecursively(obj, callback);
    });
  }

  private getColor(level: number): number {
    if (level < 10) {
      return 0x00ff00;
    } else if (level < 20 ) {
      return 0x00ffcc;
    } else {
      return 0xffaa05;
    }
  }

  public addKPIs() {
    const margin = 1;
    const zoffset = 6;
    const height_multiplier = 30;

    let kpiIndex = 0;
    this.vertex.kpis.forEach(kpi => {

      // TODO: Add object to indicate loading state

      this.measurementService.getKpiValue(kpi).subscribe(kpiValue => {
        // TODO: Handle value change

        let value = 0;
        if (!isNaN(kpiValue.value)) {
          value = kpiValue.value;
        }
        value = Math.min(value, 100);
        value = Math.max(value, 0);

        let x, y = 0;
        if (kpiIndex === 0) {
          x = -4 + margin;
          y = -4 + margin;
        } else if (kpiIndex === 1) {
          x = 3;
          y = -4 + margin;
        } else if (kpiIndex === 2) {
          x = -4 + margin;
          y = 3;
        } else if (kpiIndex === 3) {
          x = 3;
          y = 3;
        }

        const height = value / 100 * height_multiplier  + 1;
        const material = new THREE.MeshLambertMaterial( {color: this.getColor(height)} );
        const geometry = new THREE.BoxGeometry( 4, 4, height );

        const kpiMesh = new THREE.Mesh( geometry, material );
        kpiMesh.userData = this.userData;
        kpiMesh.position.set( x, y, zoffset + height / 2 );
        this.group.add(kpiMesh);

        kpiIndex++;
      });
    });

    /*
    // bottom right
    height = height_multiplier * Math.random();
    material = new THREE.MeshLambertMaterial( {color: this.getColor(height)} );
    geometry = new THREE.BoxGeometry( 4, 4, height );

    const kpi2 = new THREE.Mesh( geometry, material );
    kpi2.userData = this.userData;
    kpi2.position.set( 3, -4 + margin, zoffset + height / 2 );
    this.group.add(kpi2);

    // top left
    height = height_multiplier * Math.random();
    material = new THREE.MeshLambertMaterial( {color: this.getColor(height)} );
    geometry = new THREE.BoxGeometry( 4, 4, height );

    const kpi3 = new THREE.Mesh( geometry, material );
    kpi3.userData = this.userData;
    kpi3.position.set( -4 + margin, 4, zoffset + height / 2 );
    this.group.add(kpi3);

    // top right
    height = height_multiplier * Math.random();
    material = new THREE.MeshLambertMaterial( {color: this.getColor(height)} );
    geometry = new THREE.BoxGeometry( 4, 4, height );

    const kpi4 = new THREE.Mesh( geometry, material );
    kpi4.userData = this.userData;
    kpi4.position.set( 3, 4, zoffset + height / 2 );
    this.group.add(kpi4);
    */
  }

  private getColorForVertex(vertex: Vertex): string {
    if (vertex.type === 'alarm' || vertex.type === 'situation') {
      if (vertex.attributes !== undefined) {
        switch (vertex.attributes['severity']) {
          case 'cleared':
            return '#EEE000';
          case 'normal':
            return '#86B15B';
          case 'warning':
            return '#FCCC3B';
          case 'minor':
            return '#EE901C';
          case 'major':
            return '#E3692F';
          case 'critical':
            return '#DB4345';
        }
      }
    }
    return '#00ffcc';
  }

  private getMaterial(vertex: Vertex): THREE.MeshBasicMaterial {
    const bitmap = document.createElement('canvas');
    const g = bitmap.getContext('2d');
    const bw = 128;
    const bh = 128;

    bitmap.width = bw;
    bitmap.height = bh;

    g.fillStyle = this.getColorForVertex(vertex);
    if (vertex.type === 'situation' && vertex.attributes['source'] !== 'primary' && vertex.attributes['matchesprimary'] === 'true') {
      g.fillStyle = 'white';
    }
    g.fillRect(0, 0, bitmap.width, bitmap.height);

    if (vertex.type === 'situation' && vertex.attributes['source'] !== 'primary') {
      const p = 10;
      for (let x = 0; x <= bw; x += 20) {
        g.moveTo(0.5 + x + p, p);
        g.lineTo(0.5 + x + p, bh + p);
      }
      for (let x = 0; x <= bh; x += 20) {
        g.moveTo(p, 0.5 + x + p);
        g.lineTo(bw + p, 0.5 + x + p);
      }
      g.strokeStyle = 'white';
      g.lineWidth = 2;
      g.stroke();
    }

    g.font = '20pt Calibri';
    g.fillStyle = '#333';
    g.fillText(vertex.label, 20, 24);

    const texture = new THREE.Texture(bitmap);
    texture.needsUpdate = true;
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.minFilter = THREE.LinearFilter;

    const material =  new THREE.MeshLambertMaterial( {map: texture} );
    return material;
  }

  startMouseOver() {
    console.log('Start mouseOver on ', this.vertex.label);
    if (this.focusObject === undefined) {
      const geometry = new THREE.SphereBufferGeometry(16, 6, 6);

      const edges = new THREE.EdgesGeometry( geometry, Math.PI / 4 );
      const line = new THREE.LineSegments( edges, new THREE.LineBasicMaterial( { color: 0x0000ff } ) );


      //
      // const material = new THREE.MeshPhongMaterial( { color: 0x156289, emissive: 0x072534, side: THREE.DoubleSide, flatShading: true } );
      this.focusObject = line;
      this.group.add(line);

      this.focusTween = new TWEEN.tween( this.focusObject.rotation ).to( {
        x: Math.PI * 2,
        y: Math.PI * 2}, 5000 )
        .repeat( Infinity )
        .easing(Easing.Quadratic.In)
        .start();
    }
  }

  stopMouseOver() {
    console.log('Stop mouseOver on ', this.vertex.label);
    if (this.focusObject !== undefined) {
      // Stop the tween
      this.focusTween.stop();
      this.focusTween = undefined;
      // Remove the object
      this.group.remove(this.focusObject);
      this.focusObject = undefined;
    }
  }
}
