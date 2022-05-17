<template>
	<VerticeSummary>
		<template v-slot:title>
			Alarm - &nbsp;
			<span class="status">{{
				graphStore.$state.selectedAlarmNode?.attributes?.severity.toUpperCase()
			}}</span>
		</template>
		<template v-slot:description>
			<div>
				<strong>ID:</strong> {{ graphStore.$state.selectedAlarmNode?.id }}
			</div>
			<div>
				<strong>Label:</strong>
				{{ graphStore.$state.selectedAlarmNode?.label }}
			</div>
			<hr />
			<div>
				<strong>IO Type: </strong
				>{{ graphStore.$state.selectedAlarmNode?.attributes?.iotype }}
			</div>
			<div>
				<strong>IO ID: </strong
				>{{ graphStore.$state.selectedAlarmNode?.attributes?.ioid }}
			</div>
		</template>
		<template v-slot:connections>
			<!--<hr />
			<div><strong>Connected to: </strong>{{ parentId }}</div>
			<FeatherButton secondary @click="showDevice"
				><FeatherIcon :icon="View" /> View Device</FeatherButton
			> -->
		</template>
	</VerticeSummary>
</template>

<script setup lang="ts">
import { FeatherButton } from '@featherds/button'
import { FeatherIcon } from '@featherds/icon'
import View from '@featherds/icon/action/View'
import { useGraphStore } from '@/store/useGraphStore'
import CONST from '@/helpers/constants'
import VerticeSummary from './VerticeSummary.vue'
import { TVertice } from '@/types/TDataset'

const graphStore = useGraphStore()

/*const showDevice = () => {
	if (parentId) {
		const parent = graphStore.nodes[parentId]
		const userData: TUserData = {
			id: parentId,
			parentId: parent.parentId,
			layerId: parent.layer_id
		}
		graphStore.setSelectedNode(userData)
		graphStore.setTarget(parent.position)
	}
}*/

let colorSeverity = ref<string | undefined>()
let infoAlarm = ref<TVertice | null>().value
const objectColors = CONST.SEVERITY_COLORS as Record<string, string>
const initAlarm = () => {
	infoAlarm = graphStore.selectedAlarmNode
	if (infoAlarm && infoAlarm.attributes) {
		colorSeverity.value = objectColors[infoAlarm?.attributes?.severity]
	}
}

graphStore.$onAction((context) => {
	if (context.name === 'setSelectedAlarm') {
		context.after(() => {
			initAlarm()
		})
	}
})

initAlarm()
</script>

<style lang="scss" scoped>
$border: 1px solid rgba(0, 0, 0, 0.125);

.status {
	color: v-bind('colorSeverity');
}
</style>
