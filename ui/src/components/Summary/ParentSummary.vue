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
	</VerticeSummary>
</template>

<script setup lang="ts">
import { useGraphStore } from '@/store/useGraphStore'
import VerticeSummary from './VerticeSummary.vue'

const graphStore = useGraphStore()
</script>
