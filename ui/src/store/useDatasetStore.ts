import { defineStore } from 'pinia'
import {
	TAlarmConnection,
	TConnection,
	TEdge,
	TSituationConnection,
	TVertice
} from '@/types/TDataset'
import API from '@/services'
import groupBy from 'lodash/groupBy'
import CONST from '@/helpers/constants'
import { chain, clone, cloneDeep, mapValues, merge } from 'lodash'

type TState = {
	vertices: Record<string, TVertice[]>
	parentConnections: TConnection[]
	peerConnections: TConnection[]
	alarmConnections: TAlarmConnection[]
	currentTime: number
	alarmFilters: Record<string, boolean>
	situationFilters: Record<string, boolean>
	situationConnections: TSituationConnection[]
	selectedNode: any
}
export const useDatasetStore = defineStore('dataset', {
	state: (): TState => ({
		currentTime: CONST.TIME_SLIDER_MIN,
		vertices: {},
		parentConnections: [],
		peerConnections: [],
		alarmConnections: [],
		alarmFilters: {},
		situationFilters: {},
		situationConnections: [],
		selectedNode: {}
	}),
	actions: {
		async getDataset(timestamp: number) {
			this.alarmFilters = {}
			this.situationFilters = {}

			const resp: null | Record<string, any> = await API.getAxiosRequest(
				`/0?time=${timestamp}&szl=3&removeInventoryWithNoAlarms=true`
			)
			const vertices = resp ? (resp['vertices'] as TVertice[]) : []
			if (vertices.length > 0) {
				const verticesGrouped = groupBy(vertices, 'layer_id')
				this.vertices = verticesGrouped
				const edges = resp ? (resp['edges'] as TEdge[]) : []
				const edgesGrouped = groupBy(edges, 'type')

				const connections = buildDeviceRelantionships(
					verticesGrouped['inventory'],
					edgesGrouped['peer'],
					edgesGrouped['parent']
				)

				const alarmConnections = buildAlarmRelantionships(
					verticesGrouped['alarms'],
					edgesGrouped['alarm-to-io']
				)

				const situationConnections = buildSituationRelantionships(
					verticesGrouped['situations'],
					verticesGrouped['alarms'],
					edgesGrouped['situation-to-alarm'],
					alarmConnections
				)

				this.alarmFilters = buildVerticesFilters(verticesGrouped['alarms'])
				this.situationFilters = buildVerticesFilters(
					verticesGrouped['situations']
				)
				this.parentConnections = connections.parent
				this.peerConnections = connections.peer
				this.alarmConnections = alarmConnections
				this.situationConnections = situationConnections
				this.currentTime = timestamp
				return timestamp
			} else {
				return null
			}
		},
		async getPrevTime(timestamp: number) {
			await this.getDataset(timestamp).then((time) => {
				if (timestamp <= CONST.TIME_SLIDER_MIN) {
					this.currentTime = timestamp
				}
				if (!time && timestamp > CONST.TIME_SLIDER_MIN) {
					this.getPrevTime(timestamp - 1000 * 60)
				}
			})
		},
		async getNextTime(timestamp: number) {
			await this.getDataset(timestamp).then((time) => {
				if (timestamp >= CONST.TIME_SLIDER_MAX) {
					this.$state.currentTime = timestamp
				}
				if (!time && timestamp < CONST.TIME_SLIDER_MAX) {
					this.getNextTime(timestamp + 60 * 1000)
				}
			})
		},
		setCurrentTime(timestamp: number) {
			this.currentTime = timestamp
		},
		changeVisibility(id: string) {
			const connections = cloneDeep(this.parentConnections)
			const situationConnections = cloneDeep(this.situationConnections)

			connections.forEach((item) => {
				if (item.parentId == id) {
					item.show = !item.show

					situationConnections.forEach((situation) => {
						if (situation.deviceIds.includes(id)) {
							situation.show = !situation.show
						}
					})

					item.sources.forEach((sourceChild) => {
						situationConnections.forEach((situation) => {
							if (situation.deviceIds.includes(sourceChild.id)) {
								situation.show = !situation.show
							}
						})
					})
				}
			})

			this.parentConnections = connections
			this.situationConnections = situationConnections
		},
		handleAlarmFilters(severity: string) {
			this.alarmFilters[severity] = !this.alarmFilters[severity]
		},
		handleSituationFilters(severity: string) {
			this.situationFilters[severity] = !this.situationFilters[severity]
		}
	}
})

const buildDeviceRelantionships = (
	inventory: TVertice[],
	peerEdges: TEdge[],
	parentEdges: TEdge[]
) => {
	const connections: TConnection[] = []
	const peerConnections: TConnection[] = []
	const listIdInventory: string[] = []

	//peer connections
	if (peerEdges && peerEdges.length > 0) {
		const peerParents = groupBy(peerEdges, 'source_id')

		for (const edgeId in peerParents) {
			const source_id = peerParents[edgeId][0].source_id
			const target = inventory.find((i) => i.id == source_id)
			const vertices: TVertice[] = []
			peerParents[edgeId].forEach((edge: TEdge) => {
				const source = inventory.find((i) => i.id == edge.target_id)
				if (source) {
					listIdInventory.push(source.id)
					vertices.push(source)
				}
			})
			if (target) {
				listIdInventory.push(target.id)
				peerConnections.push({
					parentId: target.id,
					parent: target,
					show: true,
					sources: vertices
				})
			}
		}
	}

	//parent connections
	const targets = groupBy(parentEdges, 'target_id')
	for (const edgeId in targets) {
		const target_id = targets[edgeId][0].target_id
		const target = inventory.find((i) => i.id == target_id)
		const vertices: TVertice[] = []
		targets[edgeId].forEach((edge: TEdge) => {
			const source = inventory.find((i) => i.id == edge.source_id)
			if (source) {
				listIdInventory.push(source.id)
				vertices.push(source)
			}
		})
		if (target) {
			listIdInventory.push(target.id)
			connections.push({
				parentId: target.id,
				parent: target,
				show: true,
				sources: vertices
			})
		}
	}

	//aislated, not connected nodes
	const idsNotConnected = inventory.filter(
		(i) => !listIdInventory.includes(i.id)
	)
	idsNotConnected.forEach((inv) => {
		connections.push({
			parentId: inv.id,
			parent: inv,
			show: true,
			sources: []
		})
	})

	return {
		peer: peerConnections,
		parent: connections
	}
}

const buildAlarmRelantionships = (alarms: TVertice[], edges: TEdge[]) => {
	const targets = groupBy(edges, 'target_id')
	const connections: TAlarmConnection[] = []

	for (const edgeId in targets) {
		const vertices: TVertice[] = []

		targets[edgeId].forEach((edge: TEdge) => {
			const source = alarms.find((i) => i.id == edge.source_id)
			if (source) {
				//for (let i = 0; i < 10; i++) {
				//for tests
				vertices.push(source)
				//}
			}
		})

		connections.push({
			parentId: edgeId,
			show: true,
			alarms: vertices
		})
	}

	return connections
}

const buildSituationRelantionships = (
	situations: TVertice[],
	alarms: TVertice[],
	edges: TEdge[],
	alarmConnections: TAlarmConnection[]
): TSituationConnection[] => {
	const sources = groupBy(edges, 'source_id')
	const connections: TSituationConnection[] = []

	for (const edgeId in sources) {
		const vertices: TVertice[] = []
		const situation_id = sources[edgeId][0].source_id
		const situation = situations.find((i) => i.id == situation_id)

		sources[edgeId].forEach((edge: TEdge) => {
			const alarm = alarms.find((i) => i.id == edge.target_id)
			if (alarm) {
				vertices.push(alarm)
			}
		})

		const deviceIds: string[] = []
		vertices.forEach((vertice) => {
			alarmConnections.forEach((item: TAlarmConnection) => {
				const alarm = item.alarms.find((alarm) => alarm.id == vertice.id)
				if (alarm) {
					if (!deviceIds.includes(item.parentId)) {
						deviceIds.push(item.parentId)
					}
				}
			})
		})

		if (situation) {
			connections.push({
				situation: situation,
				situationId: edgeId,
				show: true,
				alarms: vertices,
				deviceIds: deviceIds
			})
		}
	}
	return connections
}

const buildVerticesFilters = (vertices: TVertice[]) => {
	const filters: Record<string, boolean> = {}
	const severities = chain(vertices)
		.groupBy('attributes.severity')
		.keys()
		.value()

	mapValues(severities, (severity: string) => (filters[severity] = true))
	return filters
}
