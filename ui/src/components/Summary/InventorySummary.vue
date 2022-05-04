<template>
	<VerticeSummary>
		<template v-slot:title>Inventory</template>
		<template v-slot:description>
			<div><strong>ID:</strong> {{ props.selectedInfo?.id }}</div>
			<div><strong>Label:</strong> {{ info.label }}</div>
		</template>
		<template v-slot:connections>
			<hr />
			<div><strong>Connected to: </strong>{{ parentId }}</div>
			<FeatherButton secondary @click="showDevice"
				><FeatherIcon :icon="View" /> View Device</FeatherButton
			>
		</template>
	</VerticeSummary>
</template>

<script setup lang="ts">
import { useDatasetStore } from '@/store/useDatasetStore'
import { useGraphStore } from '@/store/useGraphStore'
import { TUserData } from '@/types/TGraph'
import { FeatherButton } from '@featherds/button'
import { FeatherIcon } from '@featherds/icon'
import View from '@featherds/icon/action/View'
import VerticeSummary from './VerticeSummary.vue'

const props = defineProps({
	selectedInfo: {
		type: Object,
		required: true
	}
})

const showDevice = () => {
	if (parentId) {
		const parent = graphStore.nodes[parentId]
		const userData: TUserData = {
			id: parentId,
			parentId: parent.parentId,
			layerId: 'parent'
		}
		graphStore.setSelectedNode(userData)
		graphStore.setTarget(parent.position)
	}
}

const datasetStore = useDatasetStore()
const graphStore = useGraphStore()

const parentInventory = datasetStore.$state.parentConnections
let info = ref().value
let parentId = ref<string>().value

parentInventory.forEach((item, key) => {
	info = item.sources.find((i) => (i.id = props.selectedInfo.id))
	if (info != null) {
		parentId = parentInventory[key].parentId
	}
})
</script>
