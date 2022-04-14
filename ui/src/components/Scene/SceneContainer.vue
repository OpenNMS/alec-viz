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
			<Camera :position="{ x: -70, y: 30, z: -75 }" />
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
				<Box :width="1000" :height="0.1" :depth="1000" receive-shadow>
					<PhongMaterial :color="'#BFC9CA'" />
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
	Raycaster
} from 'troisjs'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import { PointerIntersectEventInterface } from 'troisjs/src/core/usePointer'
import { Builders } from '@/helpers/threesjs/builders'
import { Config } from '@/helpers/threesjs/config'
import { useDatasetStore } from '@/store/useDatasetStore'
import CONST from '@/helpers/constants'

const renderer = ref()
const scene = ref()
const inventoryGroup = ref<THREE.Group>()
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

datasetStore.$subscribe((mutation, state) => {
	inventoryGroupRef.children = []
	Builders.createParentConnections(state.parentConnections, inventoryGroupRef)
})

onMounted(() => {
	sceneRef = scene.value?.scene
	rendererRef = renderer.value?.three
	orbitCtrl = renderer.value?.three.cameraCtrl
	inventoryGroupRef = inventoryGroup.value?.group
	Config.configureRenderer(rendererRef)
	const light = dirLight.value.light
	Config.setShadowHelper(light, sceneRef)
})
</script>
