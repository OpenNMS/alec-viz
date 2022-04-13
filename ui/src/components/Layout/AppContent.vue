<template>
	<div class="timeslider">
		<TimeSlider />
	</div>
	<div class="container">
		<div class="tree"></div>
		<div class="content">
			<SceneContainer />
		</div>
		<div class="vertices">
			<div :key="key" v-for="(value, key) in vertices">
				<div>
					<strong>{{ key }}:</strong> {{ value.length }} ->
					<div :key="severity" v-for="(items, severity) in bySeverity(value)">
						{{ severity }}: {{ items.length }}
					</div>
				</div>
			</div>
		</div>
	</div>
</template>

<script setup lang="ts">
import { useDatasetStore } from '@/store/useDatasetStore'
import SceneContainer from '@/components/Scene/SceneContainer.vue'
import CONST from '@/helpers/constants'

import { filter, groupBy, chain } from 'lodash'
import { TVertice } from '@/types/TDataset'
import TimeSlider from '../../helpers/TimeSlider.vue'
const height = CONST.CANVAS_HEIGHT + 'px'

const datasetStore = useDatasetStore()
const vertices = computed(() => datasetStore.vertices || [])
const edges = computed(() => datasetStore.connections || [])

const bySeverity = (values: TVertice[]) => {
	return chain(values)
		.filter((item) => Object.keys(item.attributes).length > 0)
		.groupBy('attributes.severity')
		.value()
}
</script>

<style lang="scss" scoped>
.timeslider {
	display: flex;
	flex-direction: row;
	margin-top: 15px;

	margin: 15px 20%;
	margin-bottom: 40px;
}
.tree {
	min-width: 20%;
}
.container {
	display: flex;
	flex-direction: row;
}
.vertices {
	display: flex;
	flex-direction: column;
	text-align: start;
	width: 20%;
	padding-left: 30px;
}
.content {
	border: 1px solid gray;

	width: 60%;
	height: v-bind('height');
	box-sizing: fit-content;
}

:root {
	.slider-horizontal {
		width: 60%;
	}
}
</style>
<style src="@vueform/slider/themes/default.css"></style>
