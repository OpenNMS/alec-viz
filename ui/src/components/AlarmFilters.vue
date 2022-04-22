<template>
	<div class="tree">
		<div class="title">{{ props.title }}</div>
		<div
			v-for="(value, severity) in datasetStore.$state.alarmFilters"
			:key="severity"
		>
			<FeatherCheckbox
				:modelValue="value"
				@update:modelValue="displayHandler(severity)"
				class="alarm-checkbox"
				v-bind:class="severity"
				>{{ severity }}</FeatherCheckbox
			>
		</div>
	</div>
</template>

<script setup lang="ts">
import { useDatasetStore } from '@/store/useDatasetStore'
import CONST from '@/helpers/constants'
import { FeatherCheckbox } from '@featherds/checkbox'
const props = defineProps({
	title: {
		type: String,
		required: true
	}
})

const datasetStore = useDatasetStore()

const displayHandler = (severity: string) => {
	datasetStore.handleAlarmFilters(severity)
}
</script>

<style lang="scss" scoped>
.tree {
	display: flex;
	flex-direction: column;
	text-align: start;
	margin-left: 30px;
}

.title {
	font-weight: 600;
	margin-bottom: 10px;
}
</style>
