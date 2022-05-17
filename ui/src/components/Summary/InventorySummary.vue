<template>
	<VerticeSummary>
		<template v-slot:title>Inventory</template>
		<template v-slot:description>
			<div>
				<strong>ID:</strong> {{ graphStore.$state.selectedInventoryNode?.id }}
			</div>
			<div v-if="info">
				<strong>Label:</strong>
				{{ graphStore.$state.selectedInventoryNode?.label }}
			</div>
		</template>
		<template v-slot:connections>
			<!--<hr />
			<div>
				<strong>Connected to: </strong
				>{{ graphStore.$state.selectedInventoryNode?.id }}
			</div>
			<FeatherButton secondary @click="showDevice"
				><FeatherIcon :icon="View" /> View Device</FeatherButton
			>-->
		</template>
	</VerticeSummary>
</template>

<script setup lang="ts">
import { useGraphStore } from '@/store/useGraphStore'
import { FeatherButton } from '@featherds/button'
import { FeatherIcon } from '@featherds/icon'
import View from '@featherds/icon/action/View'
import VerticeSummary from './VerticeSummary.vue'

/*
const showDevice = () => {
	console.log(parentId)
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
}*/

const graphStore = useGraphStore()

let info = ref().value
</script>
