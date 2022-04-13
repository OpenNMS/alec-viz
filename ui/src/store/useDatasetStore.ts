import { defineStore } from 'pinia'
import { TConnections, TEdge, TVertice } from '@/types/TDataset'
import API from '@/services'
import groupBy from 'lodash/groupBy'
import CONST from '@/helpers/constants'
type TState = {
	vertices: Record<string, TVertice[]>
	connections: Record<string, TEdge[]>
	currentTime: number
}
export const useDatasetStore = defineStore('dataset', {
	state: (): TState => ({
		currentTime: CONST.TIME_SLIDER_MIN,
		vertices: {},
		connections: {}
	}),
	actions: {
		async getDataset(timestamp: number) {
			const resp: null | Record<string, any> = await API.getAxiosRequest(
				`/0?time=${timestamp}&szl=3&removeInventoryWithNoAlarms=true`
			)
			const vertices = resp ? (resp['vertices'] as TVertice[]) : []
			if (vertices.length > 0) {
				const verticesGrouped = groupBy(vertices, 'layer_id')
				this.vertices = verticesGrouped
				const edges = resp ? (resp['edges'] as TEdge[]) : []
				if (edges.length > 0) {
					const connections = groupBy(edges, 'type')
					this.connections = connections
					this.$patch({
						connections: connections
					})
				}
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
		}
	}
})
