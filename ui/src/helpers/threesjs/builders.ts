import * as THREE from 'three'
import { TConnections, TEdge, TVertice } from '@/types/TDataset'
const BASE_HEIGHT = 0.2

const createCurveConnection = (
	origin: THREE.Vector3,
	destination: THREE.Vector3,
	sceneRef: THREE.Scene
) => {
	const desplY = new THREE.Vector3().copy(origin).setY(BASE_HEIGHT).setX(1)
	const desplX = new THREE.Vector3().copy(desplY).setX(destination.x)
	const desplZ = new THREE.Vector3().copy(desplX).setZ(destination.z)

	const curve1 = new THREE.LineCurve3(desplY, desplX)
	const curve2 = new THREE.LineCurve3(desplX, desplZ)
	const curve3 = new THREE.LineCurve3(desplZ, destination)
	const curves = new THREE.CurvePath<THREE.Vector3>()
	curves.add(curve1)
	curves.add(curve2)
	curves.add(curve3)
	const geometry = new THREE.TubeGeometry(curves, 400, 0.1, 100, false)
	const material = new THREE.MeshBasicMaterial({ color: '#707B7C' })
	const mesh = new THREE.Mesh(geometry, material)
	mesh.castShadow = true
	sceneRef.add(mesh)
}

const createDeviceNode = (size: number, color: string) => {
	const geometry = new THREE.BoxGeometry(size, size, size)
	const material = new THREE.MeshBasicMaterial({ color })
	const cube = new THREE.Mesh(geometry, material)
	cube.castShadow = true
	return cube
}

const createParentConnections = (
	parentConnections: any[],
	sceneRef: THREE.Scene,
	groupRef: THREE.Group
) => {
	const rows = Math.floor(Math.sqrt(parentConnections.length))
	let column = 0
	const DIST_CHILDREN = 13
	parentConnections.forEach((groupNodes, index) => {
		const cube = createDeviceNode(4, '#5F8892')
		cube.userData = { id: groupNodes.parent.id }
		const row = Math.floor(index / rows)
		cube.position.set(column * 50, 2, row * 50)
		column++
		if (column >= rows) {
			column = 0
		}
		const children = groupNodes.sources.length
		const angleBetweenChildren = 360 / children
		groupNodes.sources.forEach((node: TVertice, subIndex: number) => {
			const subCube = createDeviceNode(3, '#85BCC9')
			subCube.userData = { id: node.id }
			const angInRad = (Math.PI / 180) * (angleBetweenChildren * subIndex)
			const x = cube.position.x + DIST_CHILDREN * Math.cos(angInRad)
			const z = cube.position.z + DIST_CHILDREN * Math.sin(angInRad)
			subCube.position.set(x, 1.5, z)
			addEdge(cube.position, subCube.position, groupRef)
			groupRef.add(subCube)
		})
		groupRef.add(cube)
	})
}

const addEdge = (
	origin: THREE.Vector3,
	destination: THREE.Vector3,
	groupRef: THREE.Group
) => {
	const point1 = new THREE.Vector3().copy(origin).setY(0.2)
	const point2 = new THREE.Vector3().copy(destination).setY(0.2)
	const curve = new THREE.LineCurve3(point1, point2)
	const geometry = new THREE.TubeGeometry(curve, 400, 0.2, 100, false)
	const material = new THREE.MeshLambertMaterial({ color: '#5C5C5C' })
	const mesh = new THREE.Mesh(geometry, material)
	mesh.castShadow = true
	groupRef.add(mesh)
}

export const Builders = {
	createParentConnections
}
