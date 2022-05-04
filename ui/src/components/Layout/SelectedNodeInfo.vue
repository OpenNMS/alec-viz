<template>
	<div v-if="graphStore.$state.selectedNode" class="summaryTypes">
		<AlarmSummary
			v-if="graphStore.$state.selectedNode.layerId === 'alarms'"
			:selected-info="graphStore.$state.selectedNode"
		/>
		<SituationSummary
			v-if="graphStore.$state.selectedNode.layerId === 'situations'"
			:selected-info="graphStore.$state.selectedNode"
		/>
		<InventorySummary
			v-if="graphStore.$state.selectedNode.layerId === 'inventory'"
			:selected-info="graphStore.$state.selectedNode"
		/>
		<ParentSummary
			v-if="graphStore.$state.selectedNode.layerId === 'parent'"
			:selected-info="graphStore.$state.selectedNode"
		/>
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
