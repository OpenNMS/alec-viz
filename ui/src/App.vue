<script setup lang="ts">
import { FeatherAppLayout } from '@featherds/app-layout'
import AppHeader from '@/components/Layout/AppHeader.vue'
import AppContent from '@/components/Layout/AppContent.vue'
</script>

<template>
  <FeatherAppLayout content-layout="full">
    <template v-slot:header>
      <AppHeader />
    </template>

    <AppContent />
  </FeatherAppLayout>
</template>

<style lang="scss">
@import './theme.scss';

#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #576783;
}
</style>
