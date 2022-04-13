import { defineStore } from 'pinia'
import { TLayer } from '@/types/TDataset'
import API from '@/services'

type TState = {
	layers: Record<string, TLayer>
}
export const useLayersStore = defineStore('layersStore', {
	state: (): TState => ({
		layers: {}
	}),
	actions: {
		async getLayers() {
			const data: null | Record<string, any> = await API.getAxiosRequest('/0')
			const dataLayers = data ? (data['layers'] as TLayer[]) : []
			if (dataLayers.length > 0) {
				const layers: Record<string, TLayer> = {}
				dataLayers.forEach((layer) => (layers[layer.id] = layer))
				this.layers = layers
			}
		}
	}
})
