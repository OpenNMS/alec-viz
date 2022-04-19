import * as THREE from 'three'
import { TVertice } from '@/types/TDataset'
import { Loaders } from './modelLoader'
import CONST from '@/helpers/constants'

const DIST_CHILDREN = 20 * CONST.DEVICE_SCALE
const DIST_PARENT = DIST_CHILDREN * 3.5

const createDeviceNode = async () => {
	try {
		const model = await Loaders.getModelDevice()
		return model
	} catch (e) {
		return createDeviceNodeMesh(16, '#36576B')
	}
}

const createDeviceNodeMesh = (size: number, color: string) => {
	const geometry = new THREE.BoxGeometry(size, size, size)
	const material = new THREE.MeshBasicMaterial({ color })
	const cube = new THREE.Mesh(geometry, material)
	cube.position
	cube.castShadow = true
	return cube
}

const createParentConnections = async (
	parentConnections: any[],
	groupRef: THREE.Group
) => {
	const rows = Math.floor(Math.sqrt(parentConnections.length))
	let column = 0
	const deviceModel = await createDeviceNode()
	parentConnections.forEach(async (groupNodes, index) => {
		const children = groupNodes.sources.length
		if (groupNodes.show) {
			const cube = deviceModel.clone()
			cube.userData = { id: groupNodes.parent.id }
			const row = Math.floor(index / rows)
			cube.position.set(column * DIST_PARENT, 0, row * DIST_PARENT)

			const angleBetweenChildren = 360 / children
			groupNodes.sources.forEach(async (node: TVertice, subIndex: number) => {
				const subCube = deviceModel.clone()
				subCube.userData = { id: node.id }
				const angInRad = (Math.PI / 180) * (angleBetweenChildren * subIndex)
				const x = cube.position.x + DIST_CHILDREN * Math.cos(angInRad)
				const z = cube.position.z + DIST_CHILDREN * Math.sin(angInRad)
				subCube.position.set(x, 0, z)
				groupRef.add(subCube)
				addEdge(cube.position, subCube.position, angInRad, groupRef)
			})
			groupRef.add(cube)
		}
		column++
		if (column >= rows) {
			column = 0
		}
	})
}

const addEdge = (
	origin: THREE.Vector3,
	destination: THREE.Vector3,
	angInRad: number,
	groupRef: THREE.Group
) => {
	const p1 = new THREE.Vector3().copy(origin).setY(0.13)
	const p2 = new THREE.Vector3().copy(destination).setY(0.13)
	const curve = new THREE.LineCurve3(p1, p2)
	const geometry = new THREE.TubeGeometry(
		curve,
		400,
		0.15 * CONST.DEVICE_SCALE,
		100,
		false
	)
	const color = '#1A1A1A'
	const material = new THREE.MeshLambertMaterial({ color })
	const mesh = new THREE.Mesh(geometry, material)
	groupRef.add(mesh)
}

export const Builders = {
	createParentConnections
}
