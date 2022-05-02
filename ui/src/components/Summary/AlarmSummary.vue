<template>
	<div class="summary">
		<div class="title">
			Alarm - &nbsp;

			<span class="status">{{
				infoAlarm.attributes.severity.toUpperCase()
			}}</span>
		</div>
		<div class="details">
			<div><strong>ID:</strong> {{ props.selectedInfo?.id }}</div>
			<div><strong>Label:</strong> {{ infoAlarm.label }}</div>
			<hr />
			<div><strong>IO Type: </strong>{{ infoAlarm?.attributes.iotype }}</div>
			<div><strong>IO ID: </strong>{{ infoAlarm?.attributes.ioid }}</div>
			<hr />
			<div><strong>Connected to: </strong>{{ parentId }}</div>
			<FeatherButton secondary @click="showDevice"
				><FeatherIcon :icon="View" /> View Device</FeatherButton
			>
		</div>
	</div>
</template>

<script setup lang="ts">
import { FeatherButton } from '@featherds/button'
import { FeatherIcon } from '@featherds/icon'
import View from '@featherds/icon/action/View'
import { useDatasetStore } from '@/store/useDatasetStore'
import { useGraphStore } from '@/store/useGraphStore'
import CONST from '@/helpers/constants'

const props = defineProps({
	selectedInfo: {
		type: Object,
		required: true
	}
})

const datasetStore = useDatasetStore()
const graphStore = useGraphStore()
const parentAlarms = datasetStore.$state.alarmConnections

const showDevice = () => {
	if (parentId) {
		const parent = graphStore.nodes[parentId]
		const userData = {
			id: parentId,
			parentId: parent.parentId,
			type: parent.layer_id
		}
		datasetStore.setSelectedNode(userData)
		graphStore.setTarget(parent.position)
	}
}

let infoAlarm = ref()
let colorAlarm = ref<string | undefined>().value
let parentId = ref<string>().value
parentAlarms.forEach((item, key) => {
	infoAlarm.value = item.alarms.find((i) => (i.id = props.selectedInfo.id))
	if (infoAlarm.value != null) {
		parentId = parentAlarms[key].parentId
	}
})
if (infoAlarm.value) {
	const severity: string = infoAlarm.value.attributes.severity
	const objectColors = CONST.SEVERITY_COLORS as Record<string, string>
	colorAlarm = objectColors[severity]
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

.details {
	padding-top: 20px;
	padding-left: 20px;
	padding-right: 20px;
	text-align: start;
}
.status {
	color: v-bind('colorAlarm');
}

hr {
	margin: 20px 0;
	color: $border;
}
</style>
