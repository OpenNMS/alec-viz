<template>
	<div class="summary">
		<div class="title">Parent Inventory</div>
		<div class="details">
			<div><strong>ID:</strong> {{ props.selectedInfo?.id }}</div>
			<div><strong>Label:</strong> {{ info.parent.label }}</div>
		</div>
	</div>
</template>

<script setup lang="ts">
import { useDatasetStore } from '@/store/useDatasetStore'
import { TConnection } from '@/types/TDataset'

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

<style lang="scss" scoped>
$border: 1px solid rgba(0, 0, 0, 0.125);
.summary {
	display: flex;
	flex-direction: column;
	border: $border;
	border-radius: 0.25rem;
	padding-bottom: 20px;
}

.title {
	display: flex;
	flex-direction: row;
	width: 100%;
	font-weight: 600;
	justify-content: center;
	border-bottom: $border;
	padding: 15px 0;
}

.details {
	padding-top: 20px;
	padding-left: 20px;
	padding-right: 20px;
	text-align: start;
}

hr {
	margin: 20px 0;
	color: $border;
}
</style>
