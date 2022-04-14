import * as THREE from 'three'
import { TConnections, TEdge, TVertice } from '@/types/TDataset'
import { Vector3 } from 'three'

const BASE_HEIGHT = 0.2
const DIST_CHILDREN = 16
const DIST_PARENT = 80

const createDeviceNode = (size: number, color: string) => {
	const geometry = new THREE.BoxGeometry(size, size, size)
	const material = new THREE.MeshBasicMaterial({ color })
	const cube = new THREE.Mesh(geometry, material)
	cube.castShadow = true
	return cube
}

const createParentConnections = (
	parentConnections: any[],
	groupRef: THREE.Group
): void => {
	const visibleNodes = parentConnections.filter((item) => item.show).length
	const rows = Math.floor(Math.sqrt(parentConnections.length))
	let column = 0
	const PARENT_HEIGHT = 6
	const CHILDREN_HEIGHT = 5

	parentConnections.forEach((groupNodes, index) => {
		const children = groupNodes.sources.length
		const size = children > 10 ? PARENT_HEIGHT * 2 : PARENT_HEIGHT
		if (groupNodes.show) {
			const cube = createDeviceNode(size, '#36576B')
			cube.userData = { id: groupNodes.parent.id }
			const row = Math.floor(index / rows)
			cube.position.set(
				column * DIST_PARENT,
				PARENT_HEIGHT / 2,
				row * DIST_PARENT
			)

			const angleBetweenChildren = 360 / children
			groupNodes.sources.forEach((node: TVertice, subIndex: number) => {
				const subCube = createDeviceNode(CHILDREN_HEIGHT, '#5082A0')
				subCube.userData = { id: node.id }
				const angInRad = (Math.PI / 180) * (angleBetweenChildren * subIndex)
				const x = cube.position.x + DIST_CHILDREN * Math.cos(angInRad)
				const z = cube.position.z + DIST_CHILDREN * Math.sin(angInRad)
				subCube.position.set(x, CHILDREN_HEIGHT / 2, z)
				addEdge(cube.position, subCube.position, groupRef)
				groupRef.add(subCube)
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
	groupRef: THREE.Group
) => {
	const point1 = new THREE.Vector3().copy(origin).setY(0.13)
	const point2 = new THREE.Vector3().copy(destination).setY(0.13)
	const curve = new THREE.LineCurve3(point1, point2)
	const geometry = new THREE.TubeGeometry(curve, 400, 0.1, 100, false)
	const material = new THREE.MeshLambertMaterial({ color: '#393939' })
	const mesh = new THREE.Mesh(geometry, material)
	mesh.castShadow = true
	groupRef.add(mesh)
}

export const Builders = {
	createParentConnections
}
