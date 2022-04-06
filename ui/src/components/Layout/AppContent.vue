
<template>
  <div class="content">
    <SceneContainer />
  </div>
</template>

<script setup lang="ts">
import SceneContainer from '@/components/Scene/SceneContainer.vue'
import CONST from '@/helpers/constants'
const height = CONST.CANVAS_HEIGHT + 'px'

</script>

<style lang="scss" scoped>
.content {
  border: 1px solid gray;
  margin: 60px auto;
  width: 60%;
  height: v-bind('height');
  box-sizing: fit-content;
}
</style>