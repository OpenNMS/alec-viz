<template>
	<div class="slider">
		<FeatherButton
			icon="Close message."
			@click="getPrevious"
			class="close-btn btn-nav"
		>
			<FeatherIcon :icon="FirstPage" />
		</FeatherButton>
		<Slider
			v-model="datasetStore.currentTime"
			:min="minTimeMs"
			:max="maxTimeMs"
			class="slider-red"
			:tooltipPosition="'bottom'"
			:format="format"
			@change="timeChanged"
		/>
		<FeatherButton
			icon="Close message."
			@click="getNext"
			class="close-btn btn-nav"
		>
			<FeatherIcon :icon="LastPage" />
		</FeatherButton>
	</div>
</template>

<script setup lang="ts">
import Slider from '@vueform/slider'
import { useDatasetStore } from '@/store/useDatasetStore'
import { FeatherButton } from '@featherds/button'
import { FeatherIcon } from '@featherds/icon'
import FirstPage from '@featherds/icon/navigation/FirstPage'
import LastPage from '@featherds/icon/navigation/LastPage'
import CONST from '@/helpers/constants'

const datasetStore = useDatasetStore()

const timeChanged = (newValue: number) => {
	datasetStore.getDataset(newValue)
}

const getPrevious = () => {
	datasetStore.$state.connections = {}
	datasetStore.$state.vertices = {}
	datasetStore.getPrevTime(currentValue.value - 1000 * 60)
}

const getNext = () => {
	datasetStore.$state.connections = {}
	datasetStore.$state.vertices = {}
	datasetStore.getNextTime(currentValue.value + 1000 * 60)
}

const format = (value: number) => {
	return `${new Date(value).toLocaleDateString()} 
        - ${new Date(value).toLocaleTimeString()}`
}

const minTimeMs = CONST.TIME_SLIDER_MIN
const maxTimeMs = CONST.TIME_SLIDER_MAX
let currentValue = ref(minTimeMs)
datasetStore.getDataset(minTimeMs)
currentValue = computed(() => datasetStore.currentTime)
</script>

<style lang="scss" scoped>
.slider {
	display: flex;
	flex-direction: row;
	justify-content: space-between;
	width: 100%;
	align-items: center;
}
:root {
	.slider-horizontal {
		width: 80%;
		--slider-tooltip-distance: 10px;
	}
}

.btn-nav {
	background-color: #54955c;
	color: white;
	&:hover {
		color: black;
	}
}
</style>
<style src="@vueform/slider/themes/default.css"></style>
