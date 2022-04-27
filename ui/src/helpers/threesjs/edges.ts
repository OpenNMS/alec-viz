import * as THREE from 'three'
import CONST from '@/helpers/constants'

const INVENTORY_EDGE_COLOR = '#000000'

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
	groupRef.add(mesh)
}

const addAlarmEdge = (
	origin: THREE.Vector3,
	destination: THREE.Vector3,
	color: string,
	groupRef: THREE.Group
) => {
	const p1 = new THREE.Vector3().copy(origin).setY(destination.y)
	const p2 = new THREE.Vector3().copy(destination)
	const curve = new THREE.LineCurve3(p1, p2)
	const geometry = new THREE.TubeGeometry(curve, 10, 0.3, 10, false)
	const material = new THREE.MeshLambertMaterial({ color })
	const mesh = new THREE.Mesh(geometry, material)
	groupRef.add(mesh)
}

const addSituationEdge = (
	origin: THREE.Vector3,
	destination: THREE.Vector3,
	color: string,
	groupRef: THREE.Group
) => {
	const p1 = new THREE.Vector3().copy(origin)
	const p2 = new THREE.Vector3().copy(destination)
	const curve = new THREE.LineCurve3(p1, p2)
	const geometry = new THREE.TubeGeometry(curve, 10, 0.5, 10, false)
	const material = new THREE.MeshLambertMaterial({ color })
	const mesh = new THREE.Mesh(geometry, material)
	groupRef.add(mesh)
}

const addMainConnectionAlarmsEdge = (
	origin: THREE.Vector3,
	destination: THREE.Vector3,
	color: string,
	groupRef: THREE.Group
) => {
	const p1 = new THREE.Vector3().copy(origin).setY(5.5 * CONST.DEVICE_SCALE)
	const p2 = new THREE.Vector3().copy(origin).setY(destination.y)
	const curve = new THREE.LineCurve3(p1, p2)
	const geometry = new THREE.TubeGeometry(curve, 400, 0.6, 100, false)
	const material = new THREE.MeshLambertMaterial({ color })
	const mesh = new THREE.Mesh(geometry, material)
	groupRef.add(mesh)
	const sphere = new THREE.SphereGeometry(1.4, 28, 16)
	const materialSphere = new THREE.MeshBasicMaterial({ color })
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
