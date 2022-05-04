import { TGraphNodes, TUserData } from '@/types/TGraph'
import { defineStore } from 'pinia'
import { Vector3 } from 'three'

/**
 * Meshes with its coordinate positions
 */

type TGraphState = {
	nodes: TGraphNodes
	target: Vector3 | null
	selectedNode: TUserData | null
}
export const useGraphStore = defineStore('graphStore', {
	state: (): TGraphState => ({
		nodes: {},
		selectedNode: null,
		target: null
	}),
	actions: {
		setNodes(newNodes: TGraphNodes) {
			const aux = this.nodes
			this.nodes = Object.assign({}, aux, newNodes)
		},
		setTarget(position: THREE.Vector3 | null) {
			this.target = position
		},
		setSelectedNode(userData: TUserData) {
			this.selectedNode = {
				id: userData.id,
				layerId: userData.layerId,
				parentId: userData.parentId
			}
		}
	}
})
