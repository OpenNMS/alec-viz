<template>
	<VerticeSummary>
		<template v-slot:title
			>Situation - &nbsp;
			<span class="status">{{
				info.situation.attributes.severity.toUpperCase()
			}}</span>
		</template>
		<template v-slot:description>
			<div><strong>ID:</strong> {{ props.selectedInfo?.id }}</div>
			<div><strong>Label:</strong> {{ situation?.label }}</div>
		</template>
		<template v-slot:connections>
			<hr />
			<p><strong>From inventory: </strong>{{ parentId }}</p>
			<div v-for="id in info.deviceIds" :key="id">
				<FeatherIcon :icon="Instances" /> {{ id }}
				<FeatherButton class="btn" secondary @click="showDevice(id)"
					><FeatherIcon :icon="View" /> View Device</FeatherButton
				>
			</div>
		</template>
	</VerticeSummary>
</template>

<script setup lang="ts">
import VerticeSummary from './VerticeSummary.vue'

import { FeatherButton } from '@featherds/button'
import { FeatherIcon } from '@featherds/icon'
import View from '@featherds/icon/action/View'
import Instances from '@featherds/icon/hardware/Instances'

import { useDatasetStore } from '@/store/useDatasetStore'
import { useGraphStore } from '@/store/useGraphStore'
import CONST from '@/helpers/constants'
import { TVertice } from '@/types/TDataset'

const props = defineProps({
	selectedInfo: {
		type: Object,
		required: true
	}
})

const datasetStore = useDatasetStore()
const graphStore = useGraphStore()
const situations = datasetStore.$state.situationConnections

const showDevice = (id: string) => {
	if (id) {
		const parent = graphStore.nodes[id]
		const userData = {
			id: parentId,
			parentId: parent.parentId,
			type: parent.layer_id
		}
		datasetStore.setSelectedNode(userData)
		graphStore.setTarget(parent.position)
	}
}

let info = ref().value
let colorSeverity = ref<string | undefined>().value
let parentId = ref<string>().value
let situation = ref<TVertice>().value

if (props.selectedInfo.id) {
	info = situations.find((i) => (i.situationId = props.selectedInfo.id))
	if (info && info.situation) {
		situation = info.situation
		const severity: string = situation?.attributes
			? situation?.attributes.severity
			: 'indeterminate'
		const objectColors = CONST.SEVERITY_COLORS as Record<string, string>
		colorSeverity = objectColors[severity]
	}
}
</script>

<style lang="scss" scoped>
.status {
	color: v-bind('colorSeverity');
}

.btn {
	margin-top: 10px;
}
</style>
