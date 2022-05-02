<template>
	<div class="summary">
		<div class="title">
			Situation - &nbsp;

			<span class="status">{{
				info.situation.attributes.severity.toUpperCase()
			}}</span>
		</div>
		<div class="details">
			<div><strong>ID:</strong> {{ props.selectedInfo?.id }}</div>
			<div><strong>Label:</strong> {{ situation?.label }}</div>
			<hr />
			<p><strong>From inventory: </strong>{{ parentId }}</p>
			<div v-for="id in info.deviceIds" :key="id">
				<FeatherIcon :icon="Instances" /> {{ id }}
				<FeatherButton class="btn" secondary @click="showDevice(id)"
					><FeatherIcon :icon="View" /> View Device</FeatherButton
				>
			</div>
		</div>
	</div>
</template>

<script setup lang="ts">
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
$border: 1px solid rgba(0, 0, 0, 0.125);
.summary {
	display: flex;
	flex-direction: column;
	border: $border;
	border-radius: 0.25rem;
	padding-bottom: 20px;
}

.title {
	display: flex;
	flex-direction: row;
	width: 100%;
	font-weight: 600;
	justify-content: center;
	border-bottom: $border;
	padding: 15px 0;
}

.status {
	color: v-bind('colorSeverity');
}

hr {
	margin: 20px 0;
	color: $border;
}

.details {
	padding-top: 20px;
	padding-left: 20px;
	padding-right: 20px;
	text-align: start;
}

.btn {
	margin-top: 10px;
}
</style>
