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
		>
			<Camera :position="{ x: -15, y: 30, z: -10 }" />
			<Scene :background="'#FCFCFC'" ref="scene">
				<HemisphereLight
					:position="{ x: -50, y: 50, z: 50 }"
					:color="'#EFFAFF'"
					:ground-color="'#E2F3FE'"
					:intensity="1"
					cast-shadow
					:shadow-map-size="{ width: 512, height: 512 }"
				/>
				<DirectionalLight
					:position="{ x: -80, y: 180, z: 400 }"
					:color="'#F8F8F8'"
					:intensity="0.1"
					cast-shadow
					:shadow-map-size="{ width: 512, height: 512 }"
					ref="dirLight"
				/>
				<Box :width="1000" :height="0.1" :depth="1000" receive-shadow>
					<PhongMaterial :color="'#DBE6EC'" />
				</Box>
				<Group ref="inventoryGroup">
					<Box
						v-for="(boxItem, index) in inventoryList"
						:key="boxItem.id"
						:size="3"
						:position="getPosition(index)"
						v-on:click="clickedBox"
						cast-shadow
						:userData="Object.create({ id: boxItem.id })"
						><LambertMaterial :color="'#7EBA84'" />
					</Box>
				</Group>
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
	LambertMaterial,
	HemisphereLight
} from 'troisjs'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import { PointerIntersectEventInterface } from 'troisjs/src/core/usePointer'
import { Builders } from '@/helpers/threesjs/builders'
import { Config } from '@/helpers/threesjs/config'
import { useDatasetStore } from '@/store/useDatasetStore'
import CONST from '@/helpers/constants'
import { BoxGeometry } from 'three'
import { anyTypeAnnotation } from '@babel/types'
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry'

const renderer = ref()
const scene = ref()
const inventoryGroup = ref<THREE.Group>()
let edges = ref()

let rendererRef: THREE.Renderer
let sceneRef: THREE.Scene
let orbitCtrl: OrbitControls
let inventoryGroupRef: THREE.Group
let boxes = ref<BoxGeometry[]>([])

const clickedBox = (event: PointerIntersectEventInterface) => {
	orbitCtrl.target = event?.intersect
		? event?.intersect?.point
		: orbitCtrl.position0
}

const getPosition = (index: number) => {
	return { x: 0, y: 1.7, z: index * 8 }
}

const datasetStore = useDatasetStore()
//datasetStore.getDataset(CONST.TIME_SLIDER_MIN)

const inventoryList = computed(() => datasetStore.vertices['inventory'] || [])
const edges2 = computed(() => datasetStore.connections['parent'] || {})
console.log(edges2.value)
datasetStore.$subscribe((mutation, state) => {
	console.log(mutation)
	/*if (mutation.payload && mutation.payload['connections']) {
		console.log(mutation.payload['connections'])
	}*/
	/*if (mutation.events.key == 'connections') {
		edges.value = state.connections['parent']
		console.log('edges', edges.value)
		const boxes: BoxGeometry[] = []
		inventoryGroupRef.children.forEach((item) => {
			boxes.push(item['geometry'])
		})
		console.log('boxes', boxes)
	}
  */
	/*if (edges.value && edges.value.length > 0 && sceneRef != null) {
		Builders.createConnectionsInventory(
			inventoryList.value,
			edges.value,
			sceneRef,
			boxes
		)
	}*/
})

/*const connectionList = computed(() => datasetStore.connections)
console.log('connection', connectionList.value)
console.log(computed(() => datasetStore.currentTime).value)*/

onMounted(() => {
	sceneRef = scene.value?.scene
	rendererRef = renderer.value?.three
	orbitCtrl = renderer.value?.three.cameraCtrl
	inventoryGroupRef = inventoryGroup.value?.group
	//Builders.createConnection(invMock[0].position, invMock[1].position, sceneRef)
	/*if (connectionList.length > 0) {
		Builders.createConnectionsInventory(
			inventoryList.value,
			connectionList,
			sceneRef,
			inventoryGroupRef
		)
	}*/

	Config.configureRenderer(rendererRef)
})
</script>
