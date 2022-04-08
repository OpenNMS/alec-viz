import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import AutoImport from 'unplugin-auto-import/vite'

export default defineConfig({
	resolve: {
		alias: {
			'@/': new URL('./src/', import.meta.url).pathname,
			'~@featherds': '@featherds'
		},
		dedupe: ['vue']
	},
	plugins: [
		vue(),

		// https://github.com/antfu/unplugin-auto-import
		AutoImport({
			imports: ['vue', '@vueuse/core', 'pinia'],
			eslintrc: {
				enabled: true,
				filepath: './.eslintrc-auto-import.json'
			}
		})
	]
})
