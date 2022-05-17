import * as THREE from 'three'
import CONST from '@/helpers/constants'

const INVENTORY_EDGE_COLOR = '#000000'
const OFFSET_ALARM_SHAPE = 5.6 //because of the design of alarm, it should connect to the top, not the center

const addInventoryEdge = (
	origin: THREE.Vector3,
	destination: THREE.Vector3,
	groupRef: THREE.Group
) => {
	const p1 = new THREE.Vector3().copy(origin).setY(0.32)
	const p2 = new THREE.Vector3().copy(destination).setY(0.32)
	const curve = new THREE.LineCurve3(p1, p2)
	const geometry = new THREE.TubeGeometry(curve, 10, 0.32, 10, false)
	const material = new THREE.MeshLambertMaterial({
		color: INVENTORY_EDGE_COLOR
	})
	const mesh = new THREE.Mesh(geometry, material)
	mesh.name = 'edge-inventory'
	groupRef.add(mesh)
}

const addAlarmEdge = (
	origin: THREE.Vector3,
	destination: THREE.Vector3,
	color: string,
	groupRef: THREE.Group
) => {
	const p1 = new THREE.Vector3()
		.copy(origin)
		.setY(destination.y + OFFSET_ALARM_SHAPE)
	const p2 = new THREE.Vector3()
		.copy(destination)
		.setY(destination.y + OFFSET_ALARM_SHAPE)
	const curve = new THREE.LineCurve3(p1, p2)
	const geometry = new THREE.TubeGeometry(curve, 20, 0.25, 20, false)
	const material = new THREE.MeshLambertMaterial({
		color: INVENTORY_EDGE_COLOR
	})
	const mesh = new THREE.Mesh(geometry, material)
	mesh.name = 'edge-alarm'
	mesh.userData = {
		originPosition: origin,
		destinationPosition: destination
	}
	groupRef.add(mesh)
}

const addSituationEdge = (
	origin: THREE.Vector3,
	originId: string,
	destination: THREE.Mesh,
	groupRef: THREE.Group
) => {
	const p1 = new THREE.Vector3()
		.copy(origin)
		.setY(origin.y + OFFSET_ALARM_SHAPE)
	const p2 = new THREE.Vector3()
		.copy(destination.position)
		.setY(destination.position.y - 3.5)
	const curve = new THREE.LineCurve3(p1, p2)
	const geometry = new THREE.TubeGeometry(curve, 10, 0.3, 10, false)
	const material = new THREE.MeshLambertMaterial({
		color: INVENTORY_EDGE_COLOR
	})
	const mesh = new THREE.Mesh(geometry, material)
	mesh.name = 'edge-situation-' + destination.userData.id + '-' + originId
	mesh.userData = {
		id: mesh.name,
		originId: originId,
		originPosition: origin,
		destination: destination.userData.id
	}
	groupRef.add(mesh)
}

const addMainConnectionAlarmsEdge = (
	origin: THREE.Vector3,
	destination: THREE.Vector3,
	color: string,
	groupRef: THREE.Group
) => {
	const p1 = new THREE.Vector3().copy(origin).setY(5.5 * CONST.DEVICE_SCALE)
	const p2 = new THREE.Vector3()
		.copy(origin)
		.setY(destination.y + OFFSET_ALARM_SHAPE)
	const curve = new THREE.LineCurve3(p1, p2)
	const geometry = new THREE.TubeGeometry(curve, 400, 0.6, 100, false)
	const material = new THREE.MeshLambertMaterial({
		color: INVENTORY_EDGE_COLOR
	})
	const mesh = new THREE.Mesh(geometry, material)
	groupRef.add(mesh)
	const sphere = new THREE.SphereGeometry(1.4, 28, 16)
	const materialSphere = new THREE.MeshBasicMaterial({
		color: INVENTORY_EDGE_COLOR
	})
	const meshSpere = new THREE.Mesh(sphere, materialSphere)
	meshSpere.position.set(p2.x, p2.y, p2.z)
	groupRef.add(meshSpere)
}
export const Edges = {
	addInventoryEdge,
	addAlarmEdge,
	addSituationEdge,
	addMainConnectionAlarmsEdge
}
