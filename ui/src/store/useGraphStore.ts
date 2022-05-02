import { TGraphNodes } from '@/types/TGraph'
import { defineStore } from 'pinia'
import { Vector3 } from 'three'

/**
 * Meshes with its coordinate positions
 */

type TState = {
	nodes: TGraphNodes
	target: Vector3 | null
}
export const useGraphStore = defineStore('graphStore', {
	state: (): TState => ({
		nodes: {},
		target: null
	}),
	actions: {
		setNodes(newNodes: TGraphNodes) {
			const aux = this.nodes
			this.nodes = Object.assign({}, aux, newNodes)
		},
		setTarget(position: THREE.Vector3 | null) {
			this.target = position
		}
	}
})
