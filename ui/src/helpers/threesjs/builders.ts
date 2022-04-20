import * as THREE from 'three'
import { TAlarmConnection, TConnection, TVertice } from '@/types/TDataset'
import { Loaders } from './modelLoader'
import CONST from '@/helpers/constants'
import { TGraphNodes } from '@/types/TGraph'

const DIST_CHILDREN = 40 * CONST.DEVICE_SCALE
const DIST_PARENT = DIST_CHILDREN * 4

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
	cube.castShadow = true
	return cube
}

const createAlarmMesh = (color: string) => {
	const geometry = new THREE.BoxGeometry(6, 6, 6)
	const material = new THREE.MeshBasicMaterial({ color })
	const cube = new THREE.Mesh(geometry, material)
	return cube
}

const createParentConnections = async (
	parentConnections: TConnection[],
	groupRef: THREE.Group,
	graphStore: any
) => {
	const rows = Math.floor(Math.sqrt(parentConnections.length))
	let column = 0
	const deviceModel = await createDeviceNode()
	const graphNodes: TGraphNodes = {}
	parentConnections.forEach(async (groupNodes, index) => {
		const children = groupNodes.sources.length
		if (groupNodes.show) {
			const cube = deviceModel.clone()
			cube.userData = { id: groupNodes.parent.id }

			const row = Math.floor(index / rows)
			cube.position.set(column * DIST_PARENT, 0, row * DIST_PARENT)
			graphNodes[groupNodes.parent.id] = {
				position: cube.position
			}
			const angleBetweenChildren = 360 / children
			groupNodes.sources.forEach(async (node: TVertice, subIndex: number) => {
				const subCube = deviceModel.clone()
				subCube.userData = { id: node.id }
				const [x, z] = getPosition(
					cube.position,
					angleBetweenChildren * subIndex,
					DIST_CHILDREN
				)
				subCube.position.set(x, 0, z)
				groupRef.add(subCube)
				graphNodes[node.id] = {
					position: subCube.position
				}

				addEdge(cube.position, subCube.position, groupRef)
			})
			groupRef.add(cube)
		}
		column++
		if (column >= rows) {
			column = 0
		}
	})
	return graphNodes
}

const createAlarmConnections = async (
	alarmConnections: TAlarmConnection[],
	nodes: TGraphNodes,
	groupRef: THREE.Group,
	graphStore: any
) => {
	const graphNodes: TGraphNodes = {}
	const HEIGHT = 50
	alarmConnections.forEach(async (alarmNodes) => {
		const children = alarmNodes.alarms.length
		if (alarmNodes.show) {
			const angleBetweenChildren = 360 / children
			alarmNodes.alarms.forEach((alarm, index) => {
				const color = getSeverityColor(alarm.attributes?.severity)
				const cube = createAlarmMesh(color)
				const parentPosition = nodes[alarmNodes.parentId]?.position
				if (parentPosition) {
					if (children == 1) {
						cube.position.set(parentPosition.x, HEIGHT, parentPosition.z)
					} else {
						const [x, z] = getPosition(
							parentPosition,
							angleBetweenChildren * index,
							7 * children
						)
						cube.position.set(x, 25 * CONST.DEVICE_SCALE, z)
					}

					addEdgeAlarm(parentPosition, cube.position, color, groupRef)
					groupRef.add(cube)
				}
			})
		}
	})
}

const getPosition = (
	originPos: THREE.Vector3,
	angle: number,
	distance: number
) => {
	const angInRad = (Math.PI / 180) * angle
	const x = originPos.x + distance * Math.cos(angInRad)
	const z = originPos.z + distance * Math.sin(angInRad)
	return [x, z]
}

const addEdge = (
	origin: THREE.Vector3,
	destination: THREE.Vector3,
	groupRef: THREE.Group
) => {
	const p1 = new THREE.Vector3().copy(origin).setY(0.32)
	const p2 = new THREE.Vector3().copy(destination).setY(0.32)
	const curve = new THREE.LineCurve3(p1, p2)
	const geometry = new THREE.TubeGeometry(curve, 400, 0.32, 100, false)
	const color = '#000000'
	const material = new THREE.MeshLambertMaterial({ color })
	const mesh = new THREE.Mesh(geometry, material)
	groupRef.add(mesh)
}

const addEdgeAlarm = (
	origin: THREE.Vector3,
	destination: THREE.Vector3,
	color: string,
	groupRef: THREE.Group
) => {
	const p1 = new THREE.Vector3().copy(origin).setY(5 * CONST.DEVICE_SCALE)
	//const p2 = new THREE.Vector3().copy(destination)
	const curve = new THREE.LineCurve3(p1, destination)
	const geometry = new THREE.TubeGeometry(curve, 400, 0.16, 100, false)
	const material = new THREE.MeshLambertMaterial({ color })
	const mesh = new THREE.Mesh(geometry, material)
	groupRef.add(mesh)
}

export const Builders = {
	createParentConnections,
	createAlarmConnections
}

const getSeverityColor = (severity: string | undefined): string => {
	const severityColors: Record<string, string> = {
		critical: '#FC1717',
		major: '#DE582A',
		minor: '#FFBD00',
		warning: '#FFF000',
		normal: '#7DD18B',
		cleared: '#71B1F1',
		indeterminate: '#E6E6E6'
	}
	return severity && severityColors[severity]
		? severityColors[severity]
		: severityColors.indeterminates
}
