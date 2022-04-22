import { TGraphNodes } from '@/types/TGraph'
import { defineStore } from 'pinia'

type TState = {
	nodes: TGraphNodes
	severityAlarmsFilters: string[]
}
export const useGraphStore = defineStore('graphStore', {
	state: (): TState => ({
		nodes: {},
		severityAlarmsFilters: []
	}),
	actions: {
		setNodes(newNodes: TGraphNodes) {
			const aux = this.nodes
			this.nodes = Object.assign({}, aux, newNodes)
		}
	}
})
