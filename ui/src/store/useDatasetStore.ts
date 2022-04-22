import { defineStore } from 'pinia'
import {
	TAlarmConnection,
	TConnection,
	TEdge,
	TVertice
} from '@/types/TDataset'
import API from '@/services'
import groupBy from 'lodash/groupBy'
import CONST from '@/helpers/constants'
import { chain, cloneDeep, mapValues } from 'lodash'

type TState = {
	vertices: Record<string, TVertice[]>
	parentConnections: TConnection[]
	alarmConnections: TAlarmConnection[]
	currentTime: number
	alarmFilters: Record<string, boolean>
}
export const useDatasetStore = defineStore('dataset', {
	state: (): TState => ({
		currentTime: CONST.TIME_SLIDER_MIN,
		vertices: {},
		parentConnections: [],
		alarmConnections: [],
		alarmFilters: {}
	}),
	actions: {
		async getDataset(timestamp: number) {
			this.alarmFilters = {}
			const resp: null | Record<string, any> = await API.getAxiosRequest(
				`/0?time=${timestamp}&szl=3&removeInventoryWithNoAlarms=true`
			)
			const vertices = resp ? (resp['vertices'] as TVertice[]) : []
			if (vertices.length > 0) {
				const verticesGrouped = groupBy(vertices, 'layer_id')
				this.vertices = verticesGrouped
				const edges = resp ? (resp['edges'] as TEdge[]) : []

				const edgesGrouped = groupBy(edges, 'type')

				const parentConnections = buildDeviceRelantionships(
					verticesGrouped['inventory'],
					edgesGrouped['parent']
				)

				const alarmConnections = buildAlarmRelantionships(
					verticesGrouped['alarms'],
					edgesGrouped['alarm-to-io']
				)

				const severityAlarms = chain(verticesGrouped['alarms'])
					.groupBy('attributes.severity')
					.keys()
					.value()

				const alarmFilters = {}
				mapValues(
					severityAlarms,
					(severity: string) => (alarmFilters[severity] = true)
				)

				this.alarmFilters = alarmFilters
				/*this.$patch({
					parentConnections: parentConnections
				})*/
				this.parentConnections = parentConnections
				this.alarmConnections = alarmConnections
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

			connections.forEach((item) => {
				if (item.parentId == id) {
					item.show = !item.show
				}
			})
			this.parentConnections = connections
		},
		handleAlarmFilters(severity: string) {
			this.alarmFilters[severity] = !this.alarmFilters[severity]
		}
	}
})

const buildDeviceRelantionships = (inventory: TVertice[], edges: TEdge[]) => {
	const targets = groupBy(edges, 'target_id')
	const connections: TConnection[] = []

	for (const edgeId in targets) {
		const target_id = targets[edgeId][0].target_id
		const target = inventory.find((i) => i.id == target_id)
		const vertices: TVertice[] = []

		targets[edgeId].forEach((edge: TEdge) => {
			const source = inventory.find((i) => i.id == edge.source_id)
			if (source) {
				vertices.push(source)
			}
		})
		if (target) {
			connections.push({
				parentId: target.id,
				parent: target,
				show: true,
				sources: vertices
			})
		}
	}
	return connections
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
