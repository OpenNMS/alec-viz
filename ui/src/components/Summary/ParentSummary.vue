<template>
	<VerticeSummary>
		<template v-slot:title> Parent Inventory </template>
		<template v-slot:description>
			<div><strong>ID:</strong> {{ props.selectedInfo?.id }}</div>
			<div><strong>Label:</strong> {{ info.parent.label }}</div>
		</template>
	</VerticeSummary>
</template>

<script setup lang="ts">
import { useDatasetStore } from '@/store/useDatasetStore'
import { TConnection } from '@/types/TDataset'
import VerticeSummary from './VerticeSummary.vue'

const props = defineProps({
	selectedInfo: {
		type: Object,
		required: true
	}
})

const datasetStore = useDatasetStore()
const parentInventory = datasetStore.$state.parentConnections
let info = ref().value

info = parentInventory.find(
	(i: TConnection) => i.parentId == props.selectedInfo.id
)
</script>
