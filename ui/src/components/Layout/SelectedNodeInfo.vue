<template>
	<div v-if="graphStore.$state.selectedNode" class="summaryTypes">
		<AlarmSummary v-if="graphStore.$state.selectedNode.layerId === 'alarms'" />
		<SituationSummary
			v-if="graphStore.$state.selectedNode.layerId === 'situations'"
		/>
		<InventorySummary
			v-if="graphStore.$state.selectedNode.layerId === 'inventory'"
		/>
		<ParentSummary v-if="graphStore.$state.selectedNode.layerId === 'parent'" />
	</div>
</template>

<script setup lang="ts">
import { useGraphStore } from '@/store/useGraphStore'
import AlarmSummary from '@/components/Summary/AlarmSummary.vue'
import ParentSummary from '@/components/Summary/ParentSummary.vue'
import SituationSummary from '@/components/Summary/SituationSummary.vue'
import InventorySummary from '@/components/Summary/InventorySummary.vue'

const graphStore = useGraphStore()
</script>

<style lang="scss" scoped>
.summaryTypes {
	padding-left: 20px;
	width: 290px;
	height: 60%;
	padding-bottom: 20px;
}
</style>
