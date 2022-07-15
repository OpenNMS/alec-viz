<template>
	<VerticeSummary>
		<template v-slot:title
			>Situation - &nbsp;
			<span class="status">{{
				graphStore.$state.selectedSituationNode?.attributes?.severity.toUpperCase()
			}}</span>
		</template>
		<template v-slot:description>
			<div>
				<strong>ID:</strong> {{ graphStore.$state.selectedSituationNode?.id }}
			</div>
			<div>
				<strong>Label:</strong>
				{{ graphStore.$state.selectedSituationNode?.label }}
			</div>
		</template>
		<template v-slot:connections>
			<hr />
			<p><strong>Alarms: </strong></p>
			<div
				v-for="id in datasetStore.relationships.situation[
					graphStore.$state.selectedSituationNode?.id
				].alarms"
				:key="id"
				class="alarm"
			>
				<FeatherIcon :icon="Instances" /> {{ id }}
				<FeatherButton class="btn" secondary @click="showAlarm(id, 'alarm')"
					><FeatherIcon :icon="View" /> View</FeatherButton
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

import { useGraphStore } from '@/store/useGraphStore'
import { useDatasetStore } from '@/store/useDatasetStore'
import CONST from '@/helpers/constants'
import { TVertice } from '@/types/TDataset'

const graphStore = useGraphStore()
const datasetStore = useDatasetStore()

const showAlarm = (id: string) => {
	graphStore.setSelectedNode(null)
	if (id) {
		const pos = graphStore.nodes[id].position
		const userData: TUserData = {
			id: id,
			layerId: 'alarms'
		}
		graphStore.setSelectedNode(userData)
		graphStore.setTarget(pos)
	}
}

let colorSeverity = ref<string | undefined>()
let situation = ref<TVertice | null>().value
const objectColors = CONST.SEVERITY_COLORS as Record<string, string>
const initSituation = () => {
	situation = graphStore.selectedSituationNode
	if (situation && situation.attributes) {
		colorSeverity.value = objectColors[situation?.attributes?.severity]
	}
}

graphStore.$onAction((context) => {
	if (context.name === 'setSelectedSituation') {
		context.after(() => {
			initSituation()
		})
	}
})

initSituation()
</script>

<style lang="scss" scoped>
.status {
	color: v-bind('colorSeverity');
}

.alarm {
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-bottom: 5px;
}
</style>
