import { TVertice } from '@/types/TDataset'
import { TGraphNodes, TUserData } from '@/types/TGraph'
import { first } from 'lodash'
import { defineStore } from 'pinia'
import { Vector3 } from 'three'
import { useDatasetStore } from './useDatasetStore'

/**
 * Meshes with its coordinate positions
 */

type TGraphState = {
	nodes: TGraphNodes
	target: Vector3 | null
	selectedNode: TUserData | null
	selectedSituationNode: TVertice | null
	selectedAlarmNode: TVertice | null
	selectedInventoryNode: TVertice | null
	selectedParentInventoryNode: TVertice | null
}
export const useGraphStore = defineStore('graphStore', {
	state: (): TGraphState => ({
		nodes: {},
		selectedNode: null,
		selectedSituationNode: null,
		selectedAlarmNode: null,
		selectedInventoryNode: null,
		selectedParentInventoryNode: null,
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
		setSelectedNode(userData: TUserData | null) {
			if (userData) {
				this.selectedNode = {
					id: userData.id,
					layerId: userData.layerId,
					parentId: userData.parentId
				}
				const datasetStore = useDatasetStore()
				const vertices = datasetStore.vertices
				const vertice = vertices[userData.id] as TVertice
				switch (userData.layerId) {
					case 'situations':
						this.setSelectedSituation(vertice)
						break
					case 'alarms':
						this.setSelectedAlarm(vertice)
						break
					case 'inventory':
						this.setSelectedInventory(vertice)
						break
					case 'parent':
						this.setSelectedParentInventory(vertice)
						break
				}
			} else {
				this.selectedNode = null
				this.selectedSituationNode = null
				this.selectedAlarmNode = null
			}
		},
		setSelectedSituation(vertice: TVertice) {
			this.selectedSituationNode = vertice
		},
		setSelectedAlarm(vertice: TVertice) {
			this.selectedAlarmNode = vertice
		},
		setSelectedInventory(vertice: TVertice) {
			this.selectedInventoryNode = vertice
		},
		setSelectedParentInventory(vertice: TVertice) {
			this.selectedParentInventoryNode = vertice
		}
	}
})
