import * as THREE from 'three'
import {
	TAlarmConnection,
	TConnection,
	TSituationConnection,
	TVertice
} from '@/types/TDataset'

import CONST from '@/helpers/constants'
import { TGraphNodes, TNodeInfo } from '@/types/TGraph'
import { Meshes } from '@/helpers/threesjs/meshes'
import { first, get, last, maxBy } from 'lodash'
import { Edges } from './edges'

const DIST_CHILDREN = 40 * CONST.DEVICE_SCALE
const DIST_PARENT = DIST_CHILDREN * 4

const createParentConnections = (
	parentConnections: TConnection[],
	groupRef: THREE.Group
) => {
	const rows = Math.floor(Math.sqrt(parentConnections.length))
	let column = 0
	const deviceModel = Meshes.createDeviceNode()
	let graphNodes: TGraphNodes = {}
	parentConnections.forEach((groupNodes, index) => {
		if (groupNodes.show) {
			const cube = deviceModel.clone()
			const id = groupNodes.parent.id
			cube.userData = { id: id, parentId: null }

			const row = Math.floor(index / rows)
			cube.position.set(column * DIST_PARENT, 0, row * DIST_PARENT)
			graphNodes[groupNodes.parent.id] = {
				position: cube.position,
				layer_id: groupNodes.parent.layer_id,
				parentId: null
			}
			const childGraphNodes = createDevicesSources(
				id,
				groupNodes.sources,
				cube.position,
				groupRef
			)
			graphNodes = Object.assign({}, graphNodes, childGraphNodes)
			groupRef.add(cube)
		}
		column++
		if (column >= rows) {
			column = 0
		}
	})

	return graphNodes
}

const createDevicesSources = (
	parentId: string,
	sources: TVertice[],
	parentPosition: THREE.Vector3,
	groupRef: THREE.Group
) => {
	const children = sources.length
	const graphNodes: TGraphNodes = {}
	const angleBetweenChildren = 360 / children
	const deviceModel = Meshes.createDeviceNode()
	sources.forEach((node: TVertice, subIndex: number) => {
		const subCube = deviceModel.clone()
		subCube.userData = { id: node.id, parentId: parentId }
		const [x, z] = getPosition(
			parentPosition,
			angleBetweenChildren * subIndex,
			DIST_CHILDREN
		)
		subCube.position.set(x, 0, z)
		groupRef.add(subCube)

		graphNodes[node.id] = {
			position: subCube.position,
			layer_id: node.layer_id,
			parentId: parentId
		}

		Edges.addInventoryEdge(parentPosition, subCube.position, groupRef)
	})
	return graphNodes
}

const createAlarmConnections = (
	alarmConnections: TAlarmConnection[],
	nodes: TGraphNodes,
	showSeverities: string[],
	groupRef: THREE.Group
) => {
	const HEIGHT = 50
	const graphNodes: TGraphNodes = {}
	const alarmModel = Meshes.createAlarmeNode()
	alarmConnections.forEach((alarmNodes) => {
		const children = alarmNodes.alarms.length
		if (alarmNodes.show) {
			const angleBetweenChildren = children < 10 ? 360 / children : 36
			alarmNodes.alarms.forEach((alarm, index) => {
				const severity = alarm.attributes?.severity
				if (severity && showSeverities.includes(severity)) {
					const color = getSeverityColor(severity)
					const cube = get(alarmModel, severity).clone()
					cube.userData = { id: alarm.id, parentId: alarmNodes.parentId }
					//inventory position
					const parentPosition = nodes[alarmNodes.parentId]?.position
					if (parentPosition) {
						if (children == 1) {
							cube.position.set(parentPosition.x, HEIGHT, parentPosition.z)
						} else {
							cube.position.set(
								...calculateAlarmPosition(
									index,
									parentPosition,
									angleBetweenChildren
								)
							)
						}

						//create central edge based on last alarm position
						if (index == alarmNodes.alarms.length - 1) {
							Edges.addMainConnectionAlarmsEdge(
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
						Edges.addAlarmEdge(parentPosition, cube.position, color, groupRef)
						groupRef.add(cube)
					}
				}
			})
		}
	})
	return graphNodes
}

const createSituationConnections = (
	situationConnections: TSituationConnection[],
	nodes: TGraphNodes,
	groupRef: THREE.Group
): TGraphNodes => {
	const graphNodes: TGraphNodes = {}
	situationConnections.forEach((situation) => {
		if (situation.show) {
			const alarmIds = situation.alarms.map((s) => s.id)

			const alarmMeshes = alarmIds.map((id) => nodes[id])
			const lastNode = last(alarmMeshes)
			const parentId = lastNode?.parentId
			if (lastNode && parentId) {
				const severity = situation.situation?.attributes?.severity
				const color = getSeverityColor(severity)
				const situationMesh = Meshes.createSituationMesh(color)

				const [x, y, z] = getSituationPostion(lastNode, parentId, nodes)
				situationMesh.position.set(x, y, z)

				situation.alarms.forEach((alarm) => {
					const alarmInGraph = nodes[alarm.id]
					if (alarmInGraph) {
						Edges.addSituationEdge(
							alarmInGraph?.position,
							situationMesh.position,
							color,
							groupRef
						)
					}
				})
				graphNodes[situation.situation.id] = {
					position: situationMesh.position,
					layer_id: situation.situation.layer_id,
					parentId: parentId
				}
				groupRef.add(situationMesh)
			}
		}
	})
	return graphNodes
}

/**
 * Calculate target point based on origin Point, angle and magnitud
 * @param originPos
 * @param angle
 * @param distance
 * @returns
 */
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

/**
 * Calculates Vector3 position based on direction of parent devices and farest nodes
 * @param alarmMeshes
 * @param parentId
 * @param nodes
 * @returns
 */
const getSituationPostion = (
	lastNode: TNodeInfo,
	id: string,
	nodes: TGraphNodes
): number[] => {
	const device: TNodeInfo = nodes[id]
	const parentDevice = device.parentId ? nodes[device.parentId] : null
	const dirX = parentDevice
		? getDirection(parentDevice.position, device.position, 'x')
		: 1
	const dirZ = parentDevice
		? getDirection(parentDevice.position, device.position, 'z')
		: 1
	const offsetDirX = 30 * dirX
	const offsetHeight = 40
	const offsetDirZ = 30 * dirZ
	const x = lastNode.position.x + offsetDirX
	const y = lastNode.position.y + offsetHeight
	const z = lastNode.position.z + offsetDirZ
	return [x, y, z]
}

/**
 * Calculates node position based on its order number, parent position and angle
 * Calculates position in spiral form
 * @param index
 * @param parentPosition
 * @param angleBetweenChildren
 * @returns
 */

const calculateAlarmPosition = (
	index: number,
	parentPosition: THREE.Vector3,
	angleBetweenChildren: number
) => {
	const alarmSize = CONST.ALARM_SIZE
	const minCountByRow = 9
	const countByRow = minCountByRow + Math.floor(index / minCountByRow)
	const distance = alarmSize * ((index + 1) / countByRow) + alarmSize * 2

	const [x, z] = getPosition(
		parentPosition,
		angleBetweenChildren * index,
		distance
	)
	const offsetFromParent = alarmSize * 4
	const heightBetweenEachNode = 5 * index
	const y = heightBetweenEachNode + offsetFromParent
	return [x, y, z]
}

/**
 * Return color based on severity
 * @param severity
 * @returns
 */
const getSeverityColor = (severity: string | undefined): string => {
	const severityColors: Record<string, string> = CONST.SEVERITY_COLORS
	return severity && severityColors[severity]
		? severityColors[severity]
		: severityColors.indeterminates
}

/**
 * Calculates vector direction between two points in (x,z) axes
 * @param p1
 * @param p2
 * @param axe
 * @returns
 */
const getDirection = (p1: THREE.Vector3, p2: THREE.Vector3, axe: 'x' | 'z') => {
	const result = p2[axe] - p1[axe]
	return result != 0 ? result / Math.abs(result) : 1
}

export const Builders = {
	createParentConnections,
	createAlarmConnections,
	createSituationConnections
}
