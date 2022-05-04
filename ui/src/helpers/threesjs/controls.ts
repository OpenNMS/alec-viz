import { DragControls } from 'three/examples/jsm/controls/DragControls'
import { Edges } from '@/helpers/threesjs/edges'
import { startsWith } from 'lodash'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'

const createDraggablesObjects = (
	groupRef: THREE.Group,
	cameraRef: THREE.Camera,
	rendererRef: THREE.Renderer,
	orbitCtrl: OrbitControls
) => {
	//draggable control has bugs sometimes,
	// parent becomes null, after event dragstart
	// use directly scene, instead of group
	const groups = groupRef.children
	const situationMeshs = groups.filter((item) =>
		startsWith(item.name, '[situation')
	)
	const controls = new DragControls(
		situationMeshs,
		cameraRef,
		rendererRef.renderer.domElement
	)
	//controls.transformGroup = true
	controls.addEventListener('dragstart', function (event) {
		orbitCtrl.enabled = false
	})

	controls.addEventListener('dragend', (event) => {
		orbitCtrl.enabled = true
		if (event && event.object) {
			updateEdge(groupRef, event.object)
		}
	})
}

const updateEdge = (inventoryGroupRef: THREE.Group, mesh: THREE.Mesh) => {
	const edges = inventoryGroupRef.children.filter((item) =>
		item.name.startsWith('edge-situation-' + mesh.name)
	)

	edges.forEach((edge) => {
		Edges.addSituationEdge(
			edge.userData.originPosition,
			edge.userData.originId,
			mesh,
			inventoryGroupRef
		)
		inventoryGroupRef.remove(edge)
	})
}

export const Controls = {
	createDraggablesObjects
}
