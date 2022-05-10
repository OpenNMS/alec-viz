<template>
	<div id="scene-container">
		<Renderer
			ref="renderer"
			orbit-ctrl
			resize="window"
			id="renderer"
			antialias
			width="500"
			height="500"
			shadow
			:pointer="{ intersectMode: 'frame' }"
		>
			<Camera :position="{ x: -90, y: 50, z: -90 }" :far="5000" ref="camera" />
			<Raycaster
				@click="onPointerEvent"
				intersect-mode="frame"
				intersect-recursive
			/>
			<Scene :background="'#F8F9F9'" ref="scene">
				<HemisphereLight
					:position="{ x: -50, y: 50, z: 50 }"
					:color="'#EFFAFF'"
					:ground-color="'#E2F3FE'"
					:intensity="1"
					cast-shadow
					:shadow-map-size="{ width: 1024, height: 1024 }"
				/>
				<DirectionalLight
					:position="{ x: -80, y: 120, z: 100 }"
					:color="'#F1F1B9'"
					:intensity="0.4"
					cast-shadow
					:shadow-camera="{ near: 0.02, far: 1000, fov: 1000 }"
					ref="dirLight"
				/>
				<DirectionalLight
					:position="{ x: 220, y: 200, z: -100 }"
					:color="'#F1F1B9'"
					:intensity="0.4"
					cast-shadow
					:shadow-camera="{ near: 0.02, far: 1000, fov: 1000 }"
					ref="dirLight2"
				/>

				<Box
					:width="4000"
					:height="0.1"
					:depth="4000"
					:position="{ x: 1500, y: 0, z: 1500 }"
					receive-shadow
				>
					<PhongMaterial :color="'#62838E'">
						<!--<Texture :src="'/src/assets/floor_test2.png'" /> -->
					</PhongMaterial>
				</Box>

				<Group ref="inventoryGroup"> </Group>
			</Scene>
		</Renderer>
	</div>
</template>

<script setup lang="ts">
import * as THREE from 'three'
import {
	Box,
	Camera,
	DirectionalLight,
	Renderer,
	Scene,
	PhongMaterial,
	Group,
	HemisphereLight,
	Raycaster,
	Texture,
	Mesh
} from 'troisjs'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'

import { PointerIntersectEventInterface } from 'troisjs/src/core/usePointer'
import { Builders } from '@/helpers/threesjs/builders'
import { Config } from '@/helpers/threesjs/config'
import { useDatasetStore } from '@/store/useDatasetStore'
import { useGraphStore } from '@/store/useGraphStore'
import {
	chain,
	filter,
	forEach,
	isEmpty,
	isEqual,
	mapKeys,
	mapValues,
	omitBy,
	pickBy,
	reduce,
	startsWith
} from 'lodash'
import { Controls } from '@/helpers/threesjs/controls'
import { TUserData } from '@/types/TGraph'

let cameraRef: THREE.Camera
const renderer = ref()
const scene = ref()
const inventoryGroup = ref()
const dirLight = ref()
const camera = ref()

let rendererRef: THREE.Renderer
let sceneRef: THREE.Scene
let orbitCtrl: OrbitControls
let inventoryGroupRef: THREE.Group
let eventsClick: Record<string, TUserData> = {}
const datasetStore = useDatasetStore()
const graphStore = useGraphStore()

const onPointerEvent = (event: PointerIntersectEventInterface) => {
	const userData = event.intersect?.object.userData
	if (userData && !isEmpty(userData) && userData.id) {
		const id = userData.id
		/*orbitCtrl.target =
			event && event?.intersect?.point
				? event?.intersect?.point
				: orbitCtrl.position0*/
		const info: TUserData = {
			id: id,
			parentId: userData.parentId,
			layerId: userData.layerId
		}
		if (!eventsClick[id]) {
			//to reduce the amount of events
			eventsClick[id] = info
			setTimeout(() => {
				if (eventsClick[id]) {
					graphStore.setSelectedNode(eventsClick[id])
					delete eventsClick[id]
				}
			}, 2000)
		}
		//
	}
}

datasetStore.$subscribe((mutation, state) => {
	const events: any = mutation.events
	if (
		events.newValue &&
		!isEqual(events.oldValue, events.newValue) &&
		events.key != 'id'
	) {
		inventoryGroupRef.clear()
		graphStore.$reset
		if (Object.keys(state.parentConnections).length) {
			//add inventory level
			const nodes = Builders.createParentConnections(
				state.parentConnections,
				inventoryGroupRef
			)

			graphStore.setNodes(nodes)
			//add alarms level
			const showAlarmSeverities = chain(state.alarmFilters)
				.pickBy()
				.keys()
				.value()
			const graphAlarmNodes = Builders.createAlarmConnections(
				state.alarmConnections,
				nodes,
				showAlarmSeverities,
				inventoryGroupRef
			)

			graphStore.setNodes(graphAlarmNodes)
			//add situations level
			const showSituationSeverities = chain(state.situationFilters)
				.pickBy()
				.keys()
				.value()
			const graphSituationNodes = Builders.createSituationConnections(
				state.situationConnections,
				graphStore.nodes,
				showSituationSeverities,
				inventoryGroupRef
			)
			graphStore.setNodes(graphSituationNodes)

			Controls.createDraggablesObjects(
				inventoryGroupRef,
				cameraRef,
				rendererRef,
				orbitCtrl
			)
		}
	}
})

graphStore.$subscribe((mutation, state) => {
	const events: any = mutation.events
	if (!isEqual(events.oldValue, events.newValue)) {
		if (state.target) {
			orbitCtrl.target = state.target
			graphStore.setTarget(null)
		}
	}
})

onMounted(() => {
	sceneRef = scene.value?.scene
	rendererRef = renderer.value?.three
	orbitCtrl = renderer.value?.three.cameraCtrl
	inventoryGroupRef = inventoryGroup.value?.group as THREE.Group
	cameraRef = camera.value.camera
	Config.configureRenderer(rendererRef)
	const light = dirLight.value.light
	Config.setShadowHelper(light, sceneRef)
})
</script>
