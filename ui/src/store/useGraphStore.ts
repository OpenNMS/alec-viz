import { TGraphNodes } from '@/types/TGraph'
import { defineStore } from 'pinia'

/**
 * Meshes with its coordinate positions
 */

type TState = {
	nodes: TGraphNodes
}
export const useGraphStore = defineStore('graphStore', {
	state: (): TState => ({
		nodes: {}
	}),
	actions: {
		setNodes(newNodes: TGraphNodes) {
			const aux = this.nodes
			this.nodes = Object.assign({}, aux, newNodes)
		}
	}
})
