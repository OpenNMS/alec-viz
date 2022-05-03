<template>
	<div class="summaryTypes">
		<AlarmSummary
			v-if="datasetStore.$state.selectedNode.type === 'alarms'"
			:selected-info="datasetStore.$state.selectedNode"
		/>
		<SituationSummary
			v-if="datasetStore.$state.selectedNode.type === 'situations'"
			:selected-info="datasetStore.$state.selectedNode"
		/>
		<InventorySummary
			v-if="datasetStore.$state.selectedNode.type === 'inventory'"
			:selected-info="datasetStore.$state.selectedNode"
		/>
		<ParentSummary
			v-if="datasetStore.$state.selectedNode.type === 'parent'"
			:selected-info="datasetStore.$state.selectedNode"
		/>
	</div>
</template>

<script setup lang="ts">
import { useDatasetStore } from '@/store/useDatasetStore'
import AlarmSummary from '@/components/Summary/AlarmSummary.vue'
import ParentSummary from '@/components/Summary/ParentSummary.vue'
import SituationSummary from '@/components/Summary/SituationSummary.vue'
import InventorySummary from '@/components/Summary/InventorySummary.vue'

const datasetStore = useDatasetStore()
</script>

<style lang="scss" scoped>
.summaryTypes {
	padding-left: 20px;
	width: 290px;
	height: 60%;
	padding-bottom: 20px;
}
</style>
