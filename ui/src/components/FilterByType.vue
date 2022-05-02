<template>
	<div class="tree">
		<div v-for="(value, severity) in props.list" :key="severity">
			<FeatherCheckbox
				:modelValue="value"
				@update:modelValue="displayHandler(props.type, severity)"
				class="alarm-checkbox"
				v-bind:class="severity"
				>{{ severity }}</FeatherCheckbox
			>
		</div>
	</div>
</template>

<script setup lang="ts">
import { useDatasetStore } from '@/store/useDatasetStore'
import { FeatherCheckbox } from '@featherds/checkbox'
const props = defineProps({
	type: {
		type: String,
		required: true
	},
	list: {
		type: Object,
		required: true
	}
})

const datasetStore = useDatasetStore()

const displayHandler = (type: string, severity: string) => {
	if (type == 'alarm') {
		datasetStore.handleAlarmFilters(severity)
	}
	if (type == 'situation') {
		datasetStore.handleSituationFilters(severity)
	}
}
</script>

<style lang="scss" scoped>
.tree {
	display: flex;
	flex-direction: column;
	text-align: start;
}

.title {
	font-weight: 600;
	margin-bottom: 10px;
}
</style>
