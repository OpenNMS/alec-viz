import * as THREE from 'three'
import {
	TAlarmConnection,
	TConnection,
	TSituationConnection,
	TVertice
} from '@/types/TDataset'

import CONST from '@/helpers/constants'
import { TGraphNodes } from '@/types/TGraph'
import { Meshes } from '@/helpers/threesjs/meshes'
import { first, keys, maxBy } from 'lodash'
const ALARM_SIZE = 8

const DIST_CHILDREN = 40 * CONST.DEVICE_SCALE
const DIST_PARENT = DIST_CHILDREN * 4

const createParentConnections = async (
	parentConnections: TConnection[],
	groupRef: THREE.Group
) => {
	const rows = Math.floor(Math.sqrt(parentConnections.length))
	let column = 0
	const deviceModel = await Meshes.createDeviceNode()
	const graphNodes: TGraphNodes = {}
	parentConnections.forEach(async (groupNodes, index) => {
		const children = groupNodes.sources.length
		if (groupNodes.show) {
			const cube = deviceModel.clone()
			cube.userData = { id: groupNodes.parent.id }

			const row = Math.floor(index / rows)
			cube.position.set(column * DIST_PARENT, 0, row * DIST_PARENT)
			graphNodes[groupNodes.parent.id] = {
				position: cube.position,
				layer_id: groupNodes.parent.layer_id,
				parentId: null
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
					position: subCube.position,
					layer_id: node.layer_id,
					parentId: groupNodes.parent.id
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
	showSeverities: string[],
	groupRef: THREE.Group
) => {
	const HEIGHT = 50
	const minCountByRow = 9
	const graphNodes: TGraphNodes = {}
	alarmConnections.forEach((alarmNodes) => {
		const children = alarmNodes.alarms.length
		if (alarmNodes.show) {
			const angleBetweenChildren = children < 10 ? 360 / children : 36
			alarmNodes.alarms.forEach((alarm, index) => {
				const countByRow = minCountByRow + Math.floor(index / minCountByRow)
				const severity = alarm.attributes?.severity
				if (severity && showSeverities.includes(severity)) {
					const color = getSeverityColor(severity)
					const cube = Meshes.createAlarmMesh(ALARM_SIZE, color)
					cube.userData = { id: alarm.id }
					//inventory position
					const parentPosition = nodes[alarmNodes.parentId]?.position
					if (parentPosition) {
						if (children == 1) {
							cube.position.set(parentPosition.x, HEIGHT, parentPosition.z)
						} else {
							const distance =
								ALARM_SIZE * ((index + 1) / countByRow) + ALARM_SIZE * 2

							const [x, z] = getPosition(
								parentPosition,
								angleBetweenChildren * index,
								distance
							)
							const y = 3 * index + ALARM_SIZE * 2
							cube.position.set(x, y * CONST.DEVICE_SCALE, z)
						}
						if (index == alarmNodes.alarms.length - 1) {
							addMainConnectionAlarms(
								parentPosition,
								cube.position,
								color,
								groupRef
							)
						}

						graphNodes[alarm.id] = {
							position: cube.position,
							layer_id: alarm.layer_id,
							parentId: alarmNodes.parentId
						}
						addEdgeAlarm(parentPosition, cube.position, color, groupRef)
						groupRef.add(cube)
					}
				}
			})
		}
	})
	return graphNodes
}

const createSituationConnections = async (
	situationConnections: TSituationConnection[],
	nodes: TGraphNodes,
	groupRef: THREE.Group
) => {
	situationConnections.forEach((situation) => {
		if (situation.show) {
			const alarmIds = situation.alarms.map((s) => s.id)

			const alarmMeshes = alarmIds.map((id) => nodes[id])
			const parentId = first(alarmMeshes)?.parentId
			const severity = situation.situation?.attributes?.severity
			const color = getSeverityColor(severity)
			const situationMesh = Meshes.createSituationMesh(color)

			const maxNodeX = maxBy(alarmMeshes, 'position.x')
			const maxNodeY = maxBy(alarmMeshes, 'position.y')
			const maxNodeZ = maxBy(alarmMeshes, 'position.z')

			const device = parentId && nodes[parentId]
			if (device) {
				const parentDevice = device.parentId ? nodes[device.parentId] : null
				const dirX = parentDevice
					? getDirection(parentDevice.position, device.position, 'x')
					: 1
				const dirZ = parentDevice
					? getDirection(parentDevice.position, device.position, 'z')
					: 1
				if (maxNodeX && maxNodeY && maxNodeZ) {
					situationMesh.position.set(
						maxNodeX?.position.x + 30 * dirX,
						maxNodeY?.position.y + 40,
						maxNodeZ?.position.z + 30 * dirZ
					)
				}

				situation.alarms.forEach((alarm) => {
					const alarmInGraph = nodes[alarm.id]
					if (alarmInGraph) {
						addEdgeSituation(
							alarmInGraph?.position,
							situationMesh.position,
							color,
							groupRef
						)
					}
				})
				groupRef.add(situationMesh)
			}
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
	const p1 = new THREE.Vector3().copy(origin).setY(destination.y)
	const p2 = new THREE.Vector3().copy(destination)
	const curve = new THREE.LineCurve3(p1, p2)
	const geometry = new THREE.TubeGeometry(curve, 400, 0.16, 100, false)
	const material = new THREE.MeshLambertMaterial({ color })
	const mesh = new THREE.Mesh(geometry, material)
	groupRef.add(mesh)
}

const addEdgeSituation = (
	origin: THREE.Vector3,
	destination: THREE.Vector3,
	color: string,
	groupRef: THREE.Group
) => {
	const p1 = new THREE.Vector3().copy(origin)
	const p2 = new THREE.Vector3().copy(destination)
	const curve = new THREE.LineCurve3(p1, p2)
	const geometry = new THREE.TubeGeometry(curve, 400, 0.5, 100, false)
	const material = new THREE.MeshLambertMaterial({ color })
	const mesh = new THREE.Mesh(geometry, material)
	groupRef.add(mesh)
}

const addMainConnectionAlarms = (
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

const getSeverityColor = (severity: string | undefined): string => {
	const severityColors: Record<string, string> = CONST.SEVERITY_COLORS
	return severity && severityColors[severity]
		? severityColors[severity]
		: severityColors.indeterminates
}

const getDirection = (
	cube: THREE.Vector3,
	subCube: THREE.Vector3,
	axe: 'x' | 'z'
) => {
	const result = subCube[axe] - cube[axe]
	return result != 0 ? result / Math.abs(result) : 1
}

export const Builders = {
	createParentConnections,
	createAlarmConnections,
	createSituationConnections
}
