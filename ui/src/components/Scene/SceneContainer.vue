


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
          </Box
        >
        <Group>
          <Box
            v-for="(boxItem, index) in inventoryList"
            :key="boxItem.id"
            :size="3"
            :position="getPosition(index)"
            v-on:click="clickedBox"
            cast-shadow
          >
            <LambertMaterial :color="'#7EBA84'" />
          </Box>
        </Group>
      </Scene>
    </Renderer>
    </div>
   
</template>



<script setup lang="ts">
import * as THREE from 'three'
import { Box, Camera,  DirectionalLight, Renderer, Scene , PhongMaterial, Group,  LambertMaterial, HemisphereLight} from 'troisjs'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import {  PointerIntersectEventInterface } from 'troisjs/src/core/usePointer'
import { Builders } from '@/helpers/threesjs/builders'
import { Config } from '@/helpers/threesjs/config'
import { useDatasetStore } from '@/store/useDatasetStore'

const renderer = ref()
const scene = ref()
const inventoryList = ref()

let rendererRef: THREE.Renderer
let sceneRef: THREE.Scene
let orbitCtrl: OrbitControls


const clickedBox = (event: PointerIntersectEventInterface) => {
	orbitCtrl.target =  event?.intersect ? event?.intersect?.point : orbitCtrl.position0
}

const getPosition = (index: number) => {
	return {x: 0, y: 1.7, z: index*8}
} 

const datasetStore = useDatasetStore()
datasetStore.getDataset(1565433427447)
datasetStore.$subscribe((mutation , state) => {
	inventoryList.value = state.vertices['inventory']
})


onMounted(() => {
	sceneRef = scene.value?.scene
	rendererRef = renderer.value?.three
	orbitCtrl = renderer.value?.three.cameraCtrl
	//Builders.createConnection(invMock[0].position, invMock[1].position, sceneRef)
	Config.configureRenderer(rendererRef)
	//store.getDataset(1565433427447)
	//console.log(store.vertices[0].label)
})

</script>


