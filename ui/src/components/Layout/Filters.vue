<template>
	<section>
		<FeatherExpansionPanel :title="'Topology'">
			<TreeView />
		</FeatherExpansionPanel>
		<FeatherExpansionPanel :title="'Alarms'">
			<FilterByType :type="'alarm'" :list="datasetStore.$state.alarmFilters" />
		</FeatherExpansionPanel>
		<FeatherExpansionPanel :title="'Situations'">
			<FilterByType
				:type="'situation'"
				:list="datasetStore.$state.situationFilters"
			/>
		</FeatherExpansionPanel>
	</section>
</template>

<script setup lang="ts">
import { FeatherExpansionPanel } from '@featherds/expansion'
import TreeView from '../TreeView.vue'
import FilterByType from '@/components/FilterByType.vue'
import { useDatasetStore } from '@/store/useDatasetStore'

const datasetStore = useDatasetStore()
</script>

<style lang="scss" scoped>
.feather-expansion-header-button {
	width: auto !important;
}
</style>
