import { createApp } from 'vue'
import App from './App.vue'
import '@featherds/styles'
import { createPinia } from 'pinia'

createApp(App).use(createPinia()).mount('#app')
