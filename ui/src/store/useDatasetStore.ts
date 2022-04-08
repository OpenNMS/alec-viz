import { defineStore } from 'pinia'
import { TEdge, TLayer, TVertice } from '@/types/TDataset'
import API from '@/services'
import groupBy from 'lodash/groupBy'

type TState = {
	vertices: Record<string, TVertice[]>
	edges: TEdge[]
}
export const useDatasetStore = defineStore('dataset', {
	state: (): TState => ({
		vertices: {},
		edges: []
	}),
	getters: {
		vertices: (state) => state.vertices,
		edges: (state) => state.edges
	},
	actions: {
		async getDataset(timestamp: number) {
			const resp: null | Record<string, any> = await API.getAxiosRequest(
				`/0?time=${timestamp}&szl=3&removeInventoryWithNoAlarms=true`
			)
			const vertices = resp ? (resp['vertices'] as TVertice[]) : []
			if (vertices.length > 0) {
				const verticesGrouped = groupBy(vertices, 'layer_id')
				this.$state.vertices = verticesGrouped
			}

			const edges = resp ? (resp['edges'] as TEdge[]) : []
			if (edges.length > 0) {
				//this.edges = edges
			}
		}
	}
})
