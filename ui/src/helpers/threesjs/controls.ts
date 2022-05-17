import { DragControls } from 'three/examples/jsm/controls/DragControls'
import { Edges } from '@/helpers/threesjs/edges'
import { startsWith } from 'lodash'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import * as THREE from 'three'
const createDraggablesObjects = (
	groupRef: THREE.Group,
	cameraRef: THREE.Camera,
	rendererRef: THREE.Renderer,
	orbitCtrl: OrbitControls
) => {
	const groups = groupRef.children
	const situationMeshs = groups.filter((item) =>
		startsWith(item.name, '[situation')
	)
	const domElement = rendererRef.renderer.domElement

	situationMeshs.forEach((sitGroup) => {
		setDraggable(sitGroup.children, cameraRef, domElement, orbitCtrl, groupRef)
	})
}

const setDraggable = (
	groupMesh: THREE.Object3D[],
	cameraRef: THREE.Camera,
	domElement: HTMLElement,
	orbitCtrl: OrbitControls,
	groupRef: THREE.Group
) => {
	const controls = new DragControls(groupMesh, cameraRef, domElement)
	controls.transformGroup = true
	controls.addEventListener('dragstart', function (event) {
		orbitCtrl.enabled = false
	})

	controls.addEventListener('dragend', (event) => {
		orbitCtrl.enabled = true
		if (event && event.object) {
			console.log('dragend')
			updateEdge(groupRef, event.object)
		}
	})
}

const updateEdge = (groupMeshes: THREE.Group, mesh: THREE.Mesh) => {
	const pos = new THREE.Vector3()
	const globalPosition = mesh.getWorldPosition(pos)

	const edges = groupMeshes.children.filter((item) =>
		item.name.startsWith('edge-situation-' + mesh.userData.id)
	)

	const meshInfo = new THREE.Mesh()
	meshInfo.userData = mesh.userData
	meshInfo.position.set(
		globalPosition.x,
		globalPosition.y - 7,
		globalPosition.z
	)

	edges.forEach((edge) => {
		Edges.addSituationEdge(
			edge.userData.originPosition,
			edge.userData.originId,
			meshInfo,
			groupMeshes
		)
		groupMeshes.remove(edge)
	})
}

export const Controls = {
	createDraggablesObjects
}
