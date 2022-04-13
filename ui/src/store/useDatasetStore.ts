import { defineStore } from 'pinia'
import { TConnections, TEdge, TVertice } from '@/types/TDataset'
import API from '@/services'
import groupBy from 'lodash/groupBy'
import CONST from '@/helpers/constants'
import { EdgesGeometry } from 'three'
import { sortBy } from 'lodash'

type TState = {
	vertices: Record<string, TVertice[]>
	parentConnections: any[]
	currentTime: number
}
export const useDatasetStore = defineStore('dataset', {
	state: (): TState => ({
		currentTime: CONST.TIME_SLIDER_MIN,
		vertices: {},
		parentConnections: []
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

				const edgesGrouped = groupBy(edges, 'type')

				const parentConnections = buildRelantionship(
					verticesGrouped['inventory'],
					edgesGrouped['parent']
				)
				/*this.$patch({
					parentConnections: parentConnections
				})*/
				this.parentConnections = parentConnections

				//build parent relationship
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

const buildRelantionship = (inventory: TVertice[], edges: TEdge[]) => {
	const targets = groupBy(edges, 'target_id')
	const connections = <any>[]

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
		connections.push({
			parent: target,
			sources: vertices
		})
	}
	return connections
}
