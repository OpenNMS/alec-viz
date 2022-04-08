
<template>
  <div class="vertices">
    <div :key="key" v-for="(value, key) in vertices">
        <div>
          <strong>{{key}}:</strong> {{value.length}}  -> 
            <div :key="severity" v-for=" (items, severity) in bySeverity(value)">{{severity}}: {{items.length}}</div>
        </div>
    </div>
  </div>
  <div class="content">
    <SceneContainer />
  </div>
</template>

<script setup lang="ts">
import { useDatasetStore } from '@/store/useDatasetStore'
import SceneContainer from '@/components/Scene/SceneContainer.vue'
import CONST from '@/helpers/constants'
import {filter, groupBy, chain} from 'lodash'
import { TVertice } from '@/types/TDataset'
const height = CONST.CANVAS_HEIGHT + 'px'
const vertices = ref()

const datasetStore = useDatasetStore()
datasetStore.getDataset(1565433427447)
datasetStore.$subscribe((mutation , state) => {
	vertices.value = state.vertices
})

const bySeverity = (values: TVertice[]) => {
	return chain(values).filter((item) => Object.keys(item.attributes).length > 0).groupBy('attributes.severity').value()
}
</script>

<style lang="scss" scoped>
.vertices {
  display: flex;
  flex-direction: column;
  text-align: start;
}
.content {
  border: 1px solid gray;
  margin: 60px auto;
  width: 60%;
  height: v-bind('height');
  box-sizing: fit-content;
}
</style>