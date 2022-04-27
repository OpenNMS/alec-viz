import * as THREE from 'three'
import { Loaders } from './modelLoader'
const SITUATION_SIZE = [10, 10, 1]

const createSituationMesh = (color: string) => {
	const geometry = new THREE.SphereGeometry(...SITUATION_SIZE)
	const material = new THREE.MeshBasicMaterial({ color })
	const mesh = new THREE.Mesh(geometry, material)
	return mesh
}

const createDeviceNode = () => {
	try {
		return Loaders.getModelDevice()
	} catch (e) {
		return createDeviceNodeMesh(16, '#36576B')
	}
}

const createDeviceNodeMesh = (size: number, color: string) => {
	const geometry = new THREE.BoxGeometry(size, size, size)
	const material = new THREE.MeshBasicMaterial({ color })
	const cube = new THREE.Mesh(geometry, material)
	cube.castShadow = true
	return cube
}

const createAlarmMesh = (size: number, color: string) => {
	const geometry = new THREE.BoxGeometry(size, size, size)
	const material = new THREE.MeshBasicMaterial({ color })
	const cube = new THREE.Mesh(geometry, material)
	return cube
}

const createAlarmeNode = () => {
	try {
		return Loaders.getModelAlarm()
	} catch (e) {
		return createAlarmMesh(8, '#36576B')
	}
}

export const Meshes = {
	createSituationMesh,
	createDeviceNode,
	createAlarmMesh,
	createAlarmeNode
}
