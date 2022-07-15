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
			<!--<Camera :position="{ x: -90, y: 50, z: -90 }" :far="5000" ref="camera" /> -->
			<Camera
				:position="{ x: -1090, y: 1000, z: -1090 }"
				:far="5000"
				ref="camera"
			/>
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
				<Group ref="bigBlockGroup"></Group>
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
	Mesh,
	AmbientLight
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
	startsWith,
	random,
	fill,
	shuffle
} from 'lodash'
import { Controls } from '@/helpers/threesjs/controls'
import { TUserData } from '@/types/TGraph'

let cameraRef: THREE.Camera
const renderer = ref()
const scene = ref()
const inventoryGroup = ref()
const bigBlockGroup = ref()

const dirLight = ref()
const camera = ref()

let rendererRef: THREE.Renderer
let sceneRef: THREE.Scene
let orbitCtrl: OrbitControls
let inventoryGroupRef: THREE.Group
let bigBlockGroupRef: THREE.Group

const datasetStore = useDatasetStore()
const graphStore = useGraphStore()

const onPointerEvent = (event: PointerIntersectEventInterface) => {
	const userData = event.intersect?.object.userData
	if (userData && userData.count) {
		bigBlockGroupRef.clear()
		if (userData.count <= 500) {
			inventoryGroupRef.visible = true
		} else {
			/*const randomData = Array.from({ length: 20 }, () =>
				random()
			)
			const dataCount = []
			let sum = 0
			randomData.forEach((num) => {
				if (sum < userData.count) {
					sum += num
					dataCount.push(num)
				}
			})
			Builders.buildBigDataStructure(
				dataCount,
				userData.color,
				bigBlockGroupRef
			)*/
			const randomLength = random(20, 40)
			if (userData.count > 500 && userData.count <= 1000) {
				const randomData = Array.from({ length: randomLength }, () =>
					random(10, 499)
				)
				Builders.buildServerStructure(
					randomData,
					userData.color,
					bigBlockGroupRef
				)
			} else {
				const randomData = Array.from({ length: randomLength }, () =>
					random(500, 1000)
				)
				Builders.buildRacksStructure(
					randomData,
					userData.color,
					bigBlockGroupRef
				)
			}
		}
	}

	if (userData && !isEmpty(userData) && userData.id) {
		const id = userData.id
		/*orbitCtrl.target =
			event && event?.intersect?.point
				? event?.intersect?.point
				: orbitCtrl.position0
		orbitCtrl.enableZoom = true*/
		const info: TUserData = {
			id: id,
			layerId: userData.layerId
		}
		//cameraRef.zoom = 10
		//cameraRef.updateProjectionMatrix()
		orbitCtrl.update()
		graphStore.setSelectedNode(info)
	}
}

datasetStore.$onAction((context) => {
	if (
		context.name === 'getDataset' ||
		context.name === 'handleAlarmFilters' ||
		context.name === 'handleSituationFilters'
	) {
		graphStore.$reset
		bigBlockGroupRef.clear()
		context.after(() => {
			inventoryGroupRef.clear()
			const nodes = Builders.buildInventory(
				datasetStore.relationships,
				inventoryGroupRef
			)
			graphStore.setNodes(nodes)

			//add alarms level
			const showAlarmSeverities = chain(datasetStore.alarmFilters)
				.pickBy()
				.keys()
				.value()
			const graphAlarmNodes = Builders.createAlarmConnections(
				datasetStore.alarmConnections,
				nodes,
				showAlarmSeverities,
				inventoryGroupRef
			)

			graphStore.setNodes(graphAlarmNodes)

			graphStore.setNodes(graphAlarmNodes)
			//add situations level
			const showSituationSeverities = chain(datasetStore.situationFilters)
				.pickBy()
				.keys()
				.value()
			const graphSituationNodes = Builders.createSituationConnections(
				datasetStore.situationConnections,
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
		})
		inventoryGroupRef.visible = false
		const bigData = [
			5000, 6000, 7000, 6000, 9000, 7000, 3000, 6000, 4000, 5000, 2000, 8000
		]
		Builders.buildBigDataStructure(shuffle(bigData), 'red', bigBlockGroupRef)
	}
})

/*datasetStore.$subscribe((mutation, state) => {
	const events: any = mutation.events

	console.log('BUILDER')
	console.log(mutation)
	inventoryGroupRef.clear()
	graphStore.$reset
	if (Object.keys(state.parentConnections).length) {
		//add inventory level
		const nodes = Builders.createParentConnections(
			state.parentConnections,
			state.peerConnections,
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
})*/

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
	bigBlockGroupRef = bigBlockGroup.value?.group as THREE.Group
	cameraRef = camera.value.camera
	/*renderer.gammaFactor = 2.2
	renderer.gammaOutput = true
	renderer.value.outputEncoding = THREE.sRGBEncoding

	const pmremGenerator = new THREE.PMREMGenerator(rendererRef)
	pmremGenerator.compileEquirectangularShader()

	const rgbeLoader = new THREE.RGBELoader()
	rgbeLoader.load(
		'https://threejs.org/examples/textures/equirectangular/venice_sunset_1k.hdr',
		function (texture) {
			const envMap = pmremGenerator.fromEquirectangular(texture).texture

			sceneRef.background = envMap
			sceneRef.environment = envMap
		}
	)*/
	Config.configureRenderer(rendererRef)
	const light = dirLight.value.light
	Config.setShadowHelper(light, sceneRef)
})
</script>
