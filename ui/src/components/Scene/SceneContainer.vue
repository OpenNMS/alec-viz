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
			<Camera :position="{ x: -90, y: 50, z: -90 }" :far="2500" />
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
					:intensity="0.2"
					cast-shadow
					:shadow-camera="{ near: 0.02, far: 1000, fov: 1000 }"
					ref="dirLight"
				/>
				<DirectionalLight
					:position="{ x: 220, y: 200, z: -100 }"
					:color="'#F1F1B9'"
					:intensity="0.1"
					cast-shadow
					:shadow-camera="{ near: 0.02, far: 1000, fov: 1000 }"
					ref="dirLight2"
				/>
				<Box
					:width="2000"
					:height="0.1"
					:depth="2000"
					:position="{ x: 300, y: 0, z: 300 }"
					receive-shadow
				>
					<PhongMaterial :color="'#BFC9CA'">
						<!--<Texture :src="'/src/assets/floor_texture_v14.png'" /> -->
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
	Texture
} from 'troisjs'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import { PointerIntersectEventInterface } from 'troisjs/src/core/usePointer'
import { Builders } from '@/helpers/threesjs/builders'
import { Config } from '@/helpers/threesjs/config'
import { useDatasetStore } from '@/store/useDatasetStore'
import { useGraphStore } from '@/store/useGraphStore'
import CONST from '@/helpers/constants'
const renderer = ref()
const scene = ref()
const inventoryGroup = ref()
const dirLight = ref()

let rendererRef: THREE.Renderer
let sceneRef: THREE.Scene
let orbitCtrl: OrbitControls
let inventoryGroupRef: THREE.Group

const onPointerEvent = (event: PointerIntersectEventInterface) => {
	/*if (event.intersect?.object.geometry.type == 'BoxGeometry') {
		console.log('click')
		orbitCtrl.target =
			event && event?.intersect?.point
				? event?.intersect?.point
				: orbitCtrl.position0
	}*/
}

const datasetStore = useDatasetStore()
const graphStore = useGraphStore()

datasetStore.$subscribe((mutation, state) => {
	inventoryGroupRef.children = []
	Builders.createParentConnections(
		state.parentConnections,
		inventoryGroupRef,
		graphStore
	).then((nodes) => {
		graphStore.setNodes(nodes)

		Builders.createAlarmConnections(
			state.alarmConnections,
			nodes,
			inventoryGroupRef,
			graphStore
		)
	})
})

onMounted(() => {
	sceneRef = scene.value?.scene
	rendererRef = renderer.value?.three
	orbitCtrl = renderer.value?.three.cameraCtrl
	inventoryGroupRef = inventoryGroup.value?.group as THREE.Group
	Config.configureRenderer(rendererRef)
	const light = dirLight.value.light
	Config.setShadowHelper(light, sceneRef)
})
</script>
