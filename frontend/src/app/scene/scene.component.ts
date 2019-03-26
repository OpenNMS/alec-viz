import {AfterViewInit, Component, ElementRef, HostListener, ViewChild} from '@angular/core';
import * as THREE from 'three';
import {Intersection, Vector3} from 'three';
import * as d3 from 'd3';
import {Simulation} from 'd3';
import * as _ from 'lodash';
import * as TWEEN from '@tweenjs/tween.js';
import './js/EnableThreeExamples';
import 'three/examples/js/controls/OrbitControls';
import 'three/examples/js/controls/PointerLockControls';
import 'three/examples/js/loaders/ColladaLoader';
import {ControlState, FocusState, StateModel, StateService} from '../state.service';
import {Endpoint, MyUserData} from './endpoint';
import {Flow} from './flow';
import {Model, ModelService, Vertex} from '../model.service';
import {MeasurementService} from '../measurement.service';
import {EndpointLink, HybridEndpointLink, LinkUsage, SimpleLineEndpointLink, TwisterPairEndpointLink} from './endpointlink';
import {Observable} from 'rxjs/internal/Observable';
import {ColladaModel} from 'three';
import {Font} from 'three';
import {WebVRService} from '../webvr.service';
import {VRControllerService} from '../vrcontroller.service';
import {of} from 'rxjs/internal/observable/of';

@Component({
    selector: 'app-scene',
    templateUrl: './scene.component.html',
    styleUrls: ['./scene.component.css']
})
export class SceneComponent implements AfterViewInit {

    private spinning: boolean;
    private spin_angle: number;

    // State
    flows: Flow[];
    endpoints: Endpoint[];
    endpointLinks: EndpointLink[];
    simulation: Simulation<any, any>;
    stateModel = new StateModel();

    initialModelLoaded = false;
    didResetViewAfterInitialModelLoad = false;
    forceSimulationInProgress = false;

    // Index the endpoints by id for easy lookup
    endpointsById: Map<any, Endpoint> = new Map<any, Endpoint>();
    endpointLinksById: Map<any, EndpointLink> = new Map<any, EndpointLink>();

    private endpointsWithActiveMouseOver: Set<Endpoint> = new Set<Endpoint>();

    private renderer: THREE.WebGLRenderer;
    private camera: THREE.PerspectiveCamera;
    private cameraGroup: THREE.Group;
    private controllerGroup: THREE.Group;
    public scene: THREE.Scene;

    public fieldOfView = 60;
    public nearClippingPane = 1;
    public farClippingPane = 10000;

    public controls: THREE.OrbitControls;
   // public pointerLockControls: THREE.PointerLockControls;

    @ViewChild('canvas')
    private canvasRef: ElementRef;

    private font: Font;

    private gridHelper: THREE.GridHelper;
    private controlState = new ControlState();
    private vrModeActive = false;

    constructor(private modelService: ModelService,
                private stateService: StateService,
                private measurementService: MeasurementService,
                private webVrService: WebVRService,
                private vrControllerService: VRControllerService) {
        this.render = this.render.bind(this);
        this.onModelLoadingCompleted = this.onModelLoadingCompleted.bind(this);

      stateService.spinning$.subscribe(spinning => {
        console.log('Spinning', spinning);
        this.spinning = spinning;
        this.spin_angle = 0;
      });
      stateService.resetView$.subscribe(() => {
        this.resetView();
      });
      stateService.stateModel$.subscribe(state => {
        this.stateModel = state;
      });
      stateService.focusState$.subscribe(state => {
        this.onFocus(state);
      });
      stateService.controlState$.subscribe(state => {
        this.onControlStateChanged(state);
      });
      this.flows = [];
      this.endpoints = [];
      this.endpointLinks = [];
    }

    private onControlStateChanged(state: ControlState) {
      if (!this.vrModeActive && state.vrMode) {
        this.activateVrMode();
      }
      this.controlState = state;
    }

    private activateVrMode() {
      if (this.vrModeActive) {
        return;
      }
      console.log('activate vr mode');
      this.vrModeActive = true;
      // The existing animation loop will stop

      // Remove the existing controls
      this.controls.dispose();
      this.controls = undefined;

      // VR Activation
      const component: SceneComponent = this;
      const vrRenderer = <any>this.renderer;
      vrRenderer.vr.enabled = true;
      vrRenderer.setAnimationLoop( function () {
        component.render();
      } );
      const vrDisplay = this.webVrService.vrDisplay;
      vrDisplay.requestPresent( [ { source: this.renderer.domElement } ] );
      vrRenderer.vr.setDevice( vrDisplay );

      // Create a new group for the VR controller and add it to the scene
      this.vrControllerService.setCamera(this.camera);
      this.controllerGroup = new THREE.Group();
      this.controllerGroup.position.x = 0;
      this.controllerGroup.position.y = 2;
      this.controllerGroup.add(this.vrControllerService.controller);
      this.scene.add(this.controllerGroup);

      // Rotate the camera to match our coordinate system
      this.cameraGroup.rotateX(Math.PI / 2);
      this.controllerGroup.rotateX(Math.PI / 2);
    }

    private handleVrController() {
      /*
      		//  THUMBPAD
		//  Oculus Go’s thumbpad has axes values and is also a button.
		//  The Y-axis is “Regular”.
		//
		//              Top: Y = -1
		//                   ↑
		//    Left: X = -1 ←─┼─→ Right: X = +1
		//                   ↓
		//           Bottom: Y = +1

		axes: [{ name: 'thumbpad', indexes: [ 0, 1 ]}],
       */
      this.vrControllerService.pollForChanges();
      const target = new THREE.Vector3();
      const direction = this.vrControllerService.controller.getWorldDirection(target)
        .normalize()
        .multiplyScalar(2);

      if (this.vrControllerService.trigger !== undefined && this.vrControllerService.trigger.pressed) {
        this.cameraGroup.position.sub(direction);
        this.controllerGroup.position.sub(direction);
      }

      if (this.vrControllerService.thumbpad !== undefined && this.vrControllerService.thumbpad.pressed) {
        this.cameraGroup.position.add(direction);
        this.controllerGroup.position.add(direction);
      }
    }

    private resetView() {
      this.camera.position.x = 0;
      this.camera.position.y = 0;
      this.camera.position.z = this.getCameraZToFitView();
      this.camera.lookAt(new Vector3(0, 0, 0));
    }

    private getCameraZToFitView()  {
      const boundingBox = new THREE.Box3();
      this.endpoints.forEach(e => {
        boundingBox.expandByObject(e.group);
      });
      const size = boundingBox.getSize();
      const maxDim = Math.max( size.x, size.y, size.z );
      return maxDim * 1.1;
    }

    private get canvas(): HTMLCanvasElement {
        return this.canvasRef.nativeElement;
    }

    private getZValue(zIndex: number): number {
      if (zIndex === undefined || zIndex < 0) {
        return 0;
      }
      return zIndex * 50;
    }

    private getZValueFor(v: Vertex, layersById: any): number {
      let zIndex = 0;
      if (v.layer_id in layersById) {
        zIndex = layersById[v.layer_id].order;
      }
      return this.getZValue(zIndex);
    }

    private onModelUpdated(model: Model) {
      console.log('got new/updated model', model);

      let didAddOrDeleteVertexOrEdge = false;
      const endpointIdsInModel = new Set<any>();
      const endpointLinkIdsInModel = new Set<any>();

      const layersById = {};
      model.layers.forEach(layer => {
        layersById[layer.id] = layer;
      });

      model.vertices.forEach((v) => {
        // Track
        endpointIdsInModel.add(v.id);

        // Do we need to create a new endpoint for this vertex?
        if (!this.endpointsById.has(v.id)) {
          // Create a new "endpoint" for the vertex and add it to the scene
          const endpoint = new Endpoint(v, this.measurementService, this.stateModel.showLabels ? this.font : null);

          endpoint.group.position.set(0, 0, this.getZValueFor(v, layersById));
          this.scene.add(endpoint.group);

          // Track the endpoints
          console.log('adding endpoint with id', endpoint.id);
          this.endpoints.push(endpoint);
          this.endpointsById.set(endpoint.id, endpoint);

          didAddOrDeleteVertexOrEdge = true;
        } else {
          // TODO: We already have an endpoint, we may need to update it
        }
      });

      model.edges.forEach((e) => {
        // Track
        endpointLinkIdsInModel.add(e.id);

        // Do we need to create a new link for this edge?
        if (!this.endpointLinksById.has(e.id)) {
          // Find the source and target endpoints
          const sourceEndpoint = this.endpointsById.get(e.source_id);
          const targetEndpoint = this.endpointsById.get(e.target_id);
          if (sourceEndpoint === undefined || targetEndpoint === undefined) {
            console.log('source or target missing for endpoint. skipping.', e);
            return;
          }

          // Create a new "link" for the edge and add it to the scene
          let endpointLink;
          const createdTwistedPairLink = false;

          /* disabled for performance
          if (e.type === 'peer' &&
            (sourceEndpoint.vertex.type === 'link' || targetEndpoint.vertex.type)) {
            createdTwistedPairLink = true;
          } else if (e.type === 'snmpinterfacelink') {
            createdTwistedPairLink = true;
          }
          */

          if (createdTwistedPairLink) {
            let linkUsage$: Observable<LinkUsage>;
            if (e.attributes !== undefined && 'snmpInterfaceResourceId' in e.attributes) {
              console.log(e.id, e.attributes['snmpInterfaceResourceId']);
              linkUsage$ = this.measurementService.getLinkUsage(e.attributes['snmpInterfaceResourceId']);
            }
            endpointLink = new TwisterPairEndpointLink(e, sourceEndpoint, targetEndpoint, linkUsage$);
          } else {
            endpointLink = new HybridEndpointLink(e, sourceEndpoint, targetEndpoint);
          }
          this.scene.add(endpointLink.group);

          console.log('adding endpoint link with id', e.id);
          this.endpointLinks.push(endpointLink);
          this.endpointLinksById.set(e.id, endpointLink);

          didAddOrDeleteVertexOrEdge = true;
        } else {
          // TODO: We already have an endpoint link, we may need to update it
        }
      });

      // Delete vertices and edges that are no longer in the model
      this.endpointsById.forEach((endpoint, k) => {
        if (!endpointIdsInModel.has(k)) {
          console.log('deleting endpoint: ', k);
          // Delete it from the indexes
          this.endpointsById.delete(k);
          const idx = this.endpoints.indexOf(endpoint);
          if (idx >= 0) {
            this.endpoints.splice(idx, 1);
          }

          // Delete it from the scene
          this.scene.remove(endpoint.group);

          didAddOrDeleteVertexOrEdge = true;
        }
      });

      this.endpointLinksById.forEach((endpointLink, k) => {
        if (!endpointLinkIdsInModel.has(k)) {
          // Delete it from the indexes
          this.endpointLinksById.delete(k);
          const idx = this.endpointLinks.indexOf(endpointLink);
          if (idx >= 0) {
            this.endpointLinks.splice(idx, 1);
          }

          // Delete it from the scene
          this.scene.remove(endpointLink.group);

          didAddOrDeleteVertexOrEdge = true;
        }
      });

      const self = this;
      function onForceSimulationTick() {
        self.forceSimulationInProgress = true;
        self.endpoints.forEach((endpoint) => {
          const pos = endpoint.group.position;
          pos.set(endpoint.x, endpoint.y, pos.z);
        });
        self.endpointLinks.forEach((endpointLink) => {
          endpointLink.trackEndpoints();
        });
      }

      function onForceSimulationEnd() {
        // We've reached a steady state
        self.forceSimulationInProgress = true;
        self.endpointLinks.forEach((endpointLink) => {
          endpointLink.onSteadyState();
        });
      }

      if (didAddOrDeleteVertexOrEdge) {
        // Stop any existing simulation
        if (this.simulation !== undefined) {
          this.simulation.stop();
        }

        this.simulation = d3.forceSimulation()
          .alphaMin(0.01) // change from default of 0.01 so we end the transition and move to a steady state faster
          .force('link', d3.forceLink().id((d: any) => {
            return d.vertex.id;
          }))
          .force('charge', d3.forceManyBody().distanceMax(300))
          .force('collide', d3.forceCollide(10)) // increase this to make sure the bodies do not collide
          .force('center', d3.forceCenter(0, 0))
          // Add a small force to the center so that the graph doesn't spread out every time it is refreshed
          .force('x', d3.forceX(0).strength(0.01))
          .force('y', d3.forceY(0).strength(0.01));

        this.simulation.nodes(this.endpoints)
          .on('tick', onForceSimulationTick)
          .on('end', onForceSimulationEnd);

        this.simulation.force<d3.ForceLink<any, any>>('link')
          .links(this.endpointLinks);
      }

      if (!this.initialModelLoaded) {
        this.initialModelLoaded = true;
      }

      console.log('done processing model update');
    }

    private createScene() {
        this.scene = new THREE.Scene();
        // this.scene.add(new THREE.AxisHelper(200));

        /*
        const geometry = new THREE.PlaneGeometry( 100, 100, 32 );
        const material = new THREE.MeshBasicMaterial( {color: 0xffff00, side: THREE.DoubleSide} );
        const plane = new THREE.Mesh( geometry, material );
        this.scene.add( plane );
         */

        // var loader = new THREE.ColladaLoader();
        // loader.load('assets/model/multimaterial.dae', this.onModelLoadingCompleted);


      this.loadFont().subscribe((font: Font) => {
        this.font = font;
        this.modelService.getModel().subscribe((model: Model) => {
          this.onModelUpdated(model);
        });
      });

      this.gridHelper = new THREE.GridHelper( 2000, 100 );
      this.gridHelper.rotateX( - Math.PI / 2 );
      this.gridHelper.position.z = -50;
      this.gridHelper.material.opacity = 0.25;
      this.gridHelper.material.transparent = true;
      this.scene.add( this.gridHelper );
    }

    private onModelLoadingCompleted(collada) {
        const modelScene = collada.scene;
        this.scene.add(modelScene);
        this.render();
    }

    private createLight() {
        const light1 = new THREE.PointLight(0xffffff, 1, 1000);
        light1.position.set(0, 0, 100);
        this.scene.add(light1);

        const light2 = new THREE.PointLight(0xffffff, 1, 1000);
        light2.position.set(0, 0, -100);
        this.scene.add(light2);

    }

    private createCamera() {
        const aspectRatio = this.getAspectRatio();
        this.camera = new THREE.PerspectiveCamera(
            this.fieldOfView,
            aspectRatio,
            this.nearClippingPane,
            this.farClippingPane
        );
        // Add the camera to a group so we can have some control
        // when we're in VR mode
        this.cameraGroup = new THREE.Group();
        this.cameraGroup.add(this.camera);

        const pointLight = new THREE.PointLight( 0xffffff );
        pointLight.position.set(1, 1, 2);
        this.camera.add(pointLight);
        // Add the camera to the scene since it includes a child object (the point light)
        this.scene.add(this.cameraGroup);

        // Set position and look at
        this.camera.position.x = 0;
        this.camera.position.y = 0;
        this.camera.position.z = 500;
    }

    private getAspectRatio(): number {
        const height = this.canvas.clientHeight;
        if (height === 0) {
            return 0;
        }
        return this.canvas.clientWidth / this.canvas.clientHeight;
    }

    private startRendering() {
        this.renderer = new THREE.WebGLRenderer({
            canvas: this.canvas,
            antialias: true
        });
        this.renderer.setPixelRatio(devicePixelRatio);
        this.renderer.setSize(this.canvas.clientWidth, this.canvas.clientHeight);

        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.renderer.setClearColor(0xffffff, 1);
        this.renderer.autoClear = true;

        const component: SceneComponent = this;

        (function render() {
            requestAnimationFrame(render);
            component.render();
        }());
    }

    public render() {
        if (this.vrModeActive) {
          this.handleVrController();
        }
        TWEEN.update();

        if (this.spinning) {
          // Calculate the radius, since the graph may have changed
          // TODO: Only calculate the radius *if* the graph has changed
          const radius = this.getCameraZToFitView();
          this.spin_angle += (2 * Math.PI / 1200);

          // Set position and look at
          this.camera.position.x = radius * Math.cos(this.spin_angle);
          this.camera.position.y = 0;
          this.camera.position.z = radius * Math.sin(this.spin_angle);
          this.camera.lookAt(new Vector3(0, 0, 0));
        }

        // flows
        // filter
        let i = this.flows.length;
        while (i--) {
          const flow = this.flows[i];
          if (flow.isDone()) {
            this.scene.remove(flow.group);
            this.flows.splice(i, 1);
          }
        }

        // maybe spawn a new one
        if (this.stateModel.flowSimulation) {
          const numEndpoints = this.endpoints.length;
          if (numEndpoints > 0 && this.flows.length < 25) {
            // randomly select two endpoints
            const endpointA = this.endpoints[Math.floor(Math.random() * numEndpoints)];
            const endpointB = this.endpoints[Math.floor(Math.random() * numEndpoints)];

            const flow = new Flow(endpointA, endpointB, 4 * Math.random());
            this.scene.add(flow.group);
            flow.start();
            this.flows.push(flow);
          }
        }

        this.renderer.render(this.scene, this.camera);
    }

    public addControls() {
        this.controls = new THREE.OrbitControls(this.camera, this.canvasRef.nativeElement);
        this.controls.rotateSpeed = 1.0;
        this.controls.zoomSpeed = 1.2;
        this.controls.enableKeys = true;
    }

    /* EVENTS */

    public onMouseDown(event: MouseEvent) {
        console.log('onMouseDown');
        // event.preventDefault();
    }

    public onMouseUp(event: MouseEvent) {
        console.log('onMouseUp');
        const intersects = this.findIntersectionsExcludingGrid(event);
        if (intersects.length > 0) {
          this.tweenTolookAt(intersects[0].point);
        }
    }

    private tweenTolookAt(target: Vector3) {
      const self = this;
      this.controls.target = target;
      new TWEEN.Tween( this.controls.object.position ).to( {
        x: target.x,
        y: target.y - 50,
        z: target.z + 40} )
        .easing(TWEEN.Easing.Quadratic.In)
        .onUpdate(function() {
          self.controls.update();
        })
        .start();
    }

    private onFocus(focusState: FocusState) {
      if (focusState.focusOn === undefined) {
        return;
      }
      const endpoint = this.endpointsById.get(focusState.focusOn.id);
      if (endpoint !== undefined) {
        this.tweenTolookAt(endpoint.group.position);
      }
    }

    @HostListener('document:mousemove', ['$event'])
    public onMouseMove(event: Event) {
      // Build a set of endpoints that intersect with the current position of the mouse
      const endpointsWithMouseOver = new Set<Endpoint>();
      this.findIntersections(event).forEach((i) => {
        const userData = <MyUserData> i.object.userData;
        // Now find a reference to the associated endpoint
        const endpoint = this.endpointsById.get(userData.endpointId);
        if (endpoint !== undefined) {
          endpointsWithMouseOver.add(endpoint);
        }
      });
      // Start the mouseOver animation for any new endpoints
      endpointsWithMouseOver.forEach(e => {
        if (!this.endpointsWithActiveMouseOver.has(e)) {
          e.startMouseOver();
        }
      });
      // Stop the mouseOver handling for existing endpoint that are no longer
      // in the intersection
      this.endpointsWithActiveMouseOver.forEach(e => {
        if (!endpointsWithMouseOver.has(e)) {
          e.stopMouseOver();
        }
      });
      // Swap the sets
      this.endpointsWithActiveMouseOver = endpointsWithMouseOver;

      // Update the active element - use the first if there are many
      let vertex;
      if (this.endpointsWithActiveMouseOver.size >= 1) {
        vertex = this.endpointsWithActiveMouseOver.values().next().value.vertex;
      }
      this.stateService.setActiveElement(vertex);
    }

    private findAllObjects(pred: THREE.Object3D[], parent: THREE.Object3D) {
      // NOTE: Better to keep separate array of selected objects
      if (parent.children.length > 0) {
        parent.children.forEach((i) => {
          pred.push(i);
          this.findAllObjects(pred, i);
        });
      }
    }

    private findIntersectionsExcludingGrid(event: any): Intersection[] {
        const intersections = this.findIntersections(event);
        return _.filter(intersections, (i: Intersection) => {
          return i.object !== this.gridHelper;
        });
    }

    private findIntersections(event: any): Intersection[] {
      // Example of mesh selection/pick:
      const raycaster = new THREE.Raycaster();
      const mouse = new THREE.Vector2();
      mouse.x =  ( (event.offsetX / this.canvasRef.nativeElement.clientWidth) * 2 - 1 );
      mouse.y =  - ( (event.offsetY / this.canvasRef.nativeElement.clientHeight) * 2 - 1 );
      raycaster.setFromCamera(mouse, this.camera);

      const obj: THREE.Object3D[] = [];
      this.findAllObjects(obj, this.scene);
      return raycaster.intersectObjects(obj);
    }

    private loadFont(): Observable<Font> {
      const loader = new THREE.FontLoader();
      return Observable.create(
        observer => loader.load( 'assets/helvetiker_regular.typeface.json', function ( font ) {
          observer.next(font);
        }));
    }

    @HostListener('window:resize', ['$event'])
    public onResize(event: Event) {
        this.canvas.style.width = '100%';
        this.canvas.style.height = '98%';

        console.log('onResize: ' + this.canvas.clientWidth + ', ' + this.canvas.clientHeight);

        this.camera.aspect = this.getAspectRatio();
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(this.canvas.clientWidth, this.canvas.clientHeight);
        this.render();
    }

    @HostListener('document:keypress', ['$event'])
    public onKeyPress(event: KeyboardEvent) {
        console.log('onKeyPress: ' + event.key);
    }

    /* LIFECYCLE */
    ngAfterViewInit() {
        this.createScene();
        this.createLight();
        this.createCamera();
        this.startRendering();
        this.addControls();
    }

}
