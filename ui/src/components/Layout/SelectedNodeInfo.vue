<template>
	<div class="summaryTypes">
		<AlarmResume
			v-if="datasetStore.$state.selectedNode.type === 'alarms'"
			:selected-info="datasetStore.$state.selectedNode"
		/>
		<SituationResume
			v-if="datasetStore.$state.selectedNode.type === 'situations'"
			:selected-info="datasetStore.$state.selectedNode"
		/>
		<InventoryResume
			v-if="datasetStore.$state.selectedNode.type === 'inventory'"
			:selected-info="datasetStore.$state.selectedNode"
		/>
		<ParentInventoryResume
			v-if="datasetStore.$state.selectedNode.type === 'parent'"
			:selected-info="datasetStore.$state.selectedNode"
		/>
	</div>
</template>

<script setup lang="ts">
import { useDatasetStore } from '@/store/useDatasetStore'
import AlarmResume from '@/components/Summary/AlarmSummary.vue'
import SituationResume from '@/components/Summary/SituationSummary.vue'
import InventoryResume from '@/components/Summary/InventorySummary.vue'
import ParentInventoryResume from '@/components/Summary/ParentSummary.vue'

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
