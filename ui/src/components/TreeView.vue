<template>
	<div class="tree">
		<h4>Topology Hierarchy</h4>
		<div
			v-for="parent in datasetStore.$state.parentConnections"
			:key="parent.id"
		>
			<FeatherCheckbox
				:modelValue="parent.show"
				@update:modelValue="displayHandler(parent.parent.id)"
				class="raw-checkbox"
				>{{ parent.parent.id }}</FeatherCheckbox
			>
		</div>
	</div>
</template>

<script setup lang="ts">
import { useDatasetStore } from '@/store/useDatasetStore'
import CONST from '@/helpers/constants'
import { FeatherCheckbox } from '@featherds/checkbox'

const datasetStore = useDatasetStore()

const displayHandler = (parentId: string) => {
	datasetStore.changeVisibility(parentId)
}
</script>

<style lang="scss" scoped>
.tree {
	display: flex;
	flex-direction: column;
	text-align: start;
}
</style>
