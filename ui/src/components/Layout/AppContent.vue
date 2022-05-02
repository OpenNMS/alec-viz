<template>
	<div class="timeslider">
		<TimeSlider />
	</div>
	<div class="container">
		<div class="panels">
			<Filters />
		</div>

		<div class="content">
			<SceneContainer />
		</div>
		<SelectedNodeInfo />
	</div>
</template>

<script setup lang="ts">
import SceneContainer from '@/components/Scene/SceneContainer.vue'
import CONST from '@/helpers/constants'
import TimeSlider from '@/helpers/TimeSlider.vue'
import SelectedNodeInfo from '@/components/Layout/SelectedNodeInfo.vue'

import Filters from './Filters.vue'
const height = CONST.CANVAS_HEIGHT + 'px'
</script>

<style lang="scss" scoped>
.timeslider {
	display: flex;
	flex-direction: row;
	margin-top: 15px;

	margin: 15px 20%;
	margin-bottom: 40px;
}
.panels {
	width: 19%;
	padding-right: 20px;
}
.container {
	display: flex;
	flex-direction: row;
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
