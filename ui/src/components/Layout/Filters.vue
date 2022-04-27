<template>
	<section>
		<FeatherExpansionPanel :title="'Topology'">
			<TreeView />
		</FeatherExpansionPanel>
		<FeatherExpansionPanel :title="'Alarms'">
			<AlarmFilters :title="'Alarms'" />
		</FeatherExpansionPanel>
	</section>
</template>

<script setup lang="ts">
import { FeatherExpansionPanel } from '@featherds/expansion'
import TreeView from '../TreeView.vue'
import AlarmFilters from '@/components/AlarmFilters.vue'
</script>

<style lang="scss" scoped>
.feather-expansion-header-button {
	width: auto !important;
}
</style>
