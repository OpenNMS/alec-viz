<template>
	<div class="summary">
		<div class="title">Inventory</div>
		<div class="details">
			<div><strong>ID:</strong> {{ props.selectedInfo?.id }}</div>
			<div><strong>Label:</strong> {{ info.label }}</div>
			<hr />
			<div><strong>Connected to: </strong>{{ parentId }}</div>
			<FeatherButton secondary @click="showDevice"
				><FeatherIcon :icon="View" /> View Device</FeatherButton
			>
		</div>
	</div>
</template>

<script setup lang="ts">
import { useDatasetStore } from '@/store/useDatasetStore'
import { useGraphStore } from '@/store/useGraphStore'
import { FeatherButton } from '@featherds/button'
import { FeatherIcon } from '@featherds/icon'
import View from '@featherds/icon/action/View'

const props = defineProps({
	selectedInfo: {
		type: Object,
		required: true
	}
})

const showDevice = () => {
	if (parentId) {
		const parent = graphStore.nodes[parentId]
		const userData = {
			id: parentId,
			parentId: parent.parentId,
			type: 'parent'
		}
		datasetStore.setSelectedNode(userData)
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
