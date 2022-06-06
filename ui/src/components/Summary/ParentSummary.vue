<template>
	<VerticeSummary>
		<template v-slot:title> Parent Inventory </template>
		<template v-slot:description>
			<div>
				<strong>ID:</strong>
				{{ graphStore.$state.selectedParentInventoryNode?.id }}
			</div>
			<div>
				<strong>Label:</strong>
				{{ graphStore.$state.selectedParentInventoryNode?.label }}
			</div>
		</template>
		<template v-slot:connections>
			<!--<hr />
			<div><strong>Connected to: </strong>{{ parentId }}</div>
			<FeatherButton secondary @click="showDevice"
				><FeatherIcon :icon="View" /> View Device</FeatherButton
			> -->
		</template>
	</VerticeSummary>
</template>

<script setup lang="ts">
import { useGraphStore } from '@/store/useGraphStore'
import VerticeSummary from './VerticeSummary.vue'

const graphStore = useGraphStore()
</script>
