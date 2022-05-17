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
			<!--<hr />
			<div v-for="id in info.deviceIds" :key="id">
				<p><strong>From inventory: </strong>{{ id }}</p>
				<FeatherIcon :icon="Instances" /> {{ id }}
				<FeatherButton class="btn" secondary @click="showDevice(id)"
					><FeatherIcon :icon="View" /> View Device</FeatherButton
				>
			</div>-->
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
import CONST from '@/helpers/constants'
import { TVertice } from '@/types/TDataset'

const graphStore = useGraphStore()

/*
const showDevice = (id: string) => {
	graphStore.setSelectedNode(null)
	if (id) {
		const parent = graphStore.nodes[id]
		const userData: TUserData = {
			id: id,
			parentId: parent.parentId,
			layerId: parent.layer_id
		}
		graphStore.setSelectedNode(userData)
		graphStore.setTarget(parent.position)
	}
}
*/
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

.btn {
	margin-top: 10px;
}
</style>
