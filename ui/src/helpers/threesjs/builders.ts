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
import {
	cloneDeep,
	difference,
	each,
	filter,
	forEach,
	get,
	groupBy,
	join,
	keys,
	last,
	map,
	maxBy,
	meanBy,
	merge,
	orderBy,
	size,
	union,
	values
} from 'lodash'
import { Edges } from './edges'

const DIST_CHILDREN = 40 * CONST.DEVICE_SCALE
const DIST_PARENT = DIST_CHILDREN * 4
/*
const createParentConnections = (
	parentConnections: TConnection[],
	peerConnections: TConnection[],
	groupRef: THREE.Group
) => {
	const rows = Math.floor(Math.sqrt(parentConnections.length))
	let column = 0
	const deviceModel = Meshes.createParentDeviceNode()
	let graphNodes: TGraphNodes = {}

	parentConnections.forEach((groupNodes, index) => {
		if (groupNodes.show) {
			const id = groupNodes.parent.id
			const cube = deviceModel.clone()

			const userData = {
				id: id,
				parentId: null,
				layerId: 'parent'
			}
			cube.traverse((m) => {
				m.userData = userData
			})

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
			//id of device
			
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
	parentConnections: TConnection[],
	groupRef: THREE.Group
) => {
	const children = sources.length
	const graphNodes: TGraphNodes = {}
	const angleBetweenChildren = 360 / children
	const deviceModel = Meshes.createDeviceNode()
	sources.forEach((node: TVertice, subIndex: number) => {
		const subCube = deviceModel.clone()
		const userData = { id: node.id, parentId: parentId, layerId: node.layer_id }
		subCube.traverse((m) => {
			m.userData = userData
		})
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
}*/

const buildInventory = (relationships: any, group: THREE.Group) => {
	const inventoryList = cloneDeep(relationships.parent)
	let parentIds: string[] = keys(groupBy(inventoryList, 'targets')).filter(
		(id) => id != ''
	)
	const aislatedNodesIds: string[] = []
	forEach(inventoryList, (value, key) => {
		if (value.sources.length === 0 && value.targets.length === 0) {
			aislatedNodesIds.push(key)
		}
	})
	if (aislatedNodesIds.length > 0) {
		parentIds = parentIds.concat(aislatedNodesIds)
	}
	const parentsCount = parentIds.length
	const rows = Math.floor(Math.sqrt(parentsCount))
	let column = 0
	const deviceParentModel = Meshes.createParentDeviceNode()
	const graphNodes: TGraphNodes = {}
	let index = 0
	let maxLastX = 0
	let maxLastZ = 0
	forEach(parentIds, (id) => {
		const nodeInfo = inventoryList[id]

		if (!graphNodes[id] && nodeInfo) {
			const cube = deviceParentModel.clone()
			const row = Math.floor(index / rows)
			let posX = column * DIST_PARENT
			if (posX < maxLastX) {
				posX = maxLastX + DIST_PARENT
			}

			let posZ = row * DIST_PARENT
			if (posZ < maxLastZ + DIST_PARENT) {
				posZ = maxLastZ + DIST_PARENT
			}

			cube.position.set(posX, 0, posZ)
			const userData = { id: id, layerId: 'parent' }
			cube.userData = userData
			cube.traverse((m) => {
				m.userData = userData
			})
			graphNodes[id] = {
				position: cube.position
			}

			if (nodeInfo.sources.length > 0) {
				const childGraphNodes = addChildrenInventory(
					id,
					nodeInfo.sources,
					cube.position,
					1,
					group,
					inventoryList,
					graphNodes
				)
				if (keys(childGraphNodes).length > 0) {
					maxLastX =
						maxBy(values(childGraphNodes), 'position.x')?.position.x || 0
					merge(graphNodes, childGraphNodes)
				}
			}

			group.add(cube)

			column++
			index++
			if (column >= rows) {
				column = 0
				maxLastZ = maxBy(values(graphNodes), 'position.z')?.position.z || 0
				maxLastX = 0
			}
		}
	})

	return graphNodes
}

const addChildrenInventory = (
	parentId: string,
	sources: string[],
	parentPosition: THREE.Vector3,
	level: number,
	groupRef: THREE.Group,
	inventoryList: any,
	graphNodes: any
) => {
	const children = sources.length
	const angleBetweenChildren = 360 / children
	const deviceModel = Meshes.createDeviceNode()
	const childrenGroupNodes: TGraphNodes = {}
	sources.forEach((id: string, subIndex: number) => {
		if (!graphNodes[id] && !childrenGroupNodes[id]) {
			const subCube = deviceModel.clone()
			const userData = { id: id, layerId: 'inventory' }
			subCube.traverse((m) => {
				m.userData = userData
			})
			const subNodes = inventoryList[id].sources.concat(
				inventoryList[id].targets
			)
			let distance = DIST_CHILDREN
			if (children > 13 && subIndex > 13) {
				distance = DIST_CHILDREN * 1.8
			}
			if (subNodes.length > 1) {
				distance = distance * 2.5
			}
			const [x, z] = getPosition(
				parentPosition,
				angleBetweenChildren * (subIndex + level),
				distance
			)
			subCube.position.set(x, 0, z)
			groupRef.add(subCube)

			childrenGroupNodes[id] = {
				position: subCube.position
			}
			graphNodes[id] = {
				position: subCube.position
			}
			Edges.addInventoryEdge(parentPosition, subCube.position, groupRef)

			if (inventoryList[id]) {
				if (subNodes.length > 0) {
					const subGraphNodes = addChildrenInventory(
						id,
						subNodes,
						subCube.position,
						level++,
						groupRef,
						inventoryList,
						graphNodes
					)
					if (keys(subGraphNodes).length > 0) {
						merge(childrenGroupNodes, subGraphNodes)
						merge(graphNodes, subGraphNodes)
					}
				}
			}
		}
	})

	return childrenGroupNodes
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
					const userData = {
						id: alarm.id,
						parentId: alarmNodes.parentId,
						layerId: alarm.layer_id
					}
					cube.traverse((m: THREE.Mesh) => {
						m.userData = userData
					})
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
					} else {
						console.log('ELSE ELSE')
						console.log(alarmNodes)
						console.log('ELSE ELSE')
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
	showSeverities: string[],
	groupRef: THREE.Group
): TGraphNodes => {
	const graphNodes: TGraphNodes = {}
	const situationModel = Meshes.createSituationNode()
	const situationsByDevice = groupSituationsByDevice(situationConnections)
	situationConnections.forEach((situation) => {
		if (situation.show) {
			const alarmIds = situation.alarms.map((s) => s.id)
			const alarmMeshes = alarmIds.map((id) => nodes[id])
			const lastNode = last(alarmMeshes)
			const parentId = lastNode?.parentId
			if (lastNode && parentId) {
				const severity = situation.situation?.attributes?.severity
				if (severity && showSeverities.includes(severity)) {
					const situationMesh = get(situationModel, severity).clone()
					situationMesh.name = situation.situation.id
					const userData = {
						id: situation.situation.id,
						parentId: parentId,
						layerId: situation.situation.layer_id
					}
					situationMesh.traverse((m: THREE.Mesh) => {
						m.userData = userData
					})
					situationMesh.name = situation.situation.id
					situationMesh.userData = {
						id: situation.situation.id
					}

					//const [x, y, z] = getSituationPostion(lastNode, parentId, nodes)
					const [x, y, z] = getMeanSituationPostion(
						alarmMeshes,
						parentId,
						situation.deviceIds,
						situationsByDevice,
						nodes
					)
					situationMesh.position.set(x, y, z)

					situation.alarms.forEach((alarm) => {
						const alarmInGraph = nodes[alarm.id]
						if (alarmInGraph) {
							Edges.addSituationEdge(
								alarmInGraph.position,
								alarm.id,
								situationMesh,
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
	const offsetHeight = 60
	const offsetDirZ = 30 * dirZ
	const x = lastNode.position.x + offsetDirX
	const y = lastNode.position.y + offsetHeight
	const z = lastNode.position.z + offsetDirZ
	return [x, y, z]
}

/**
 * Calculates Vector3 position based on direction of parent devices and farest nodes
 * @param alarmMeshes
 * @param parentId
 * @param nodes
 * @returns
 */
const getMeanSituationPostion = (
	alarmMeshes: TNodeInfo[],
	id: string,
	deviceIds: string[],
	situationsByDevice: any,
	nodes: TGraphNodes
): number[] => {
	const alarmsByDevice = groupBy(alarmMeshes, 'parentId')
	const lastNode = last(alarmMeshes)
	if (lastNode) {
		const parentId = lastNode?.parentId
		if (size(alarmsByDevice) == 1 && parentId) {
			if (situationsByDevice[parentId].length == 1) {
				return getSituationPostion(lastNode, parentId, nodes)
			} else {
				const index = situationsByDevice[parentId].indexOf(parentId) + 1
				const angle = angleToRad(360 / situationsByDevice[parentId].length)
				const [x, y, z] = calculateAlarmPosition(
					index,
					lastNode?.position,
					angle,
					30
				)
				const posY = y + lastNode?.position.y
				return [x, posY, z]
			}
		} else {
			const lastItems = map(alarmsByDevice, (item) => last(item))
			const meanX = meanBy(lastItems, 'position.x')
			const maxY = maxBy(lastItems, 'position.y')?.position.y || 0
			const meanZ = meanBy(lastItems, 'position.z')
			const offset = 50
			const x = meanX + offset
			const y = Math.abs(lastNode.position.x - meanX) / 1.5 + maxY + 100
			const z = meanZ + offset
			return [x, y, z]
		}
	}
	return []
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
	angleBetweenChildren: number,
	size?: number
) => {
	const alarmSize = size ? size : CONST.ALARM_SIZE * 2.5
	const minCountByRow = 9
	const countByRow = minCountByRow + Math.floor(index / minCountByRow)
	const distance = alarmSize * ((index + 1) / countByRow) + alarmSize * 2

	const [x, z] = getPosition(
		parentPosition,
		angleBetweenChildren * index,
		distance
	)
	const offsetYFromParent = alarmSize * 4
	const heightBetweenEachNode = 5 * index
	const y = heightBetweenEachNode + offsetYFromParent
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

const angleToRad = (angle: number) => {
	return (Math.PI / 180) * angle
}

const groupSituationsByDevice = (
	situationConnections: TSituationConnection[]
) => {
	/*const situationsByDevice = flatMap(
		situationConnections.map((s) => {
			return s.deviceIds.map((id) => {
				return { deviceId: id, situation: s.situationId }
			})
		})
	)
	const grouped = groupBy(situationsByDevice, 'deviceId'))*/
	const situationsByDevice: Record<string, string[]> = {}
	situationConnections.map((s) => {
		return s.deviceIds.map((id) => {
			if (!situationsByDevice[id]) {
				situationsByDevice[id] = []
			}
			situationsByDevice[id].push(s.situationId)
		})
	})
	return situationsByDevice
}

export const Builders = {
	createAlarmConnections,
	createSituationConnections,
	buildInventory
}
