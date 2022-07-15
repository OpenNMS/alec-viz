import * as THREE from 'three'
import CONST from '@/helpers/constants'

const configureRenderer = (rendererRef: THREE.Renderer) => {
	const parentNodeWidth = document.getElementById('scene-container')
	rendererRef.setSize(
		parentNodeWidth?.clientWidth || 1000,
		CONST.CANVAS_HEIGHT,
		false
	)

	window.addEventListener('resize', function () {
		rendererRef.setSize(
			parentNodeWidth?.clientWidth || 1000,
			CONST.CANVAS_HEIGHT,
			false
		)
	})
}

const setShadowHelper = (
	light: THREE.DirectionalLight,
	sceneRef: THREE.Scene
) => {
	const side = 600
	light.shadow.camera.top = side * 2
	light.shadow.camera.bottom = -side
	light.shadow.camera.left = side
	light.shadow.camera.right = -side
	light.shadow.mapSize.set(4096, 4096)
	const shadowHelper = new THREE.CameraHelper(light.shadow.camera)
	shadowHelper.position.set(-3300, 100, 300)
	shadowHelper.visible = false
	sceneRef.add(shadowHelper)
}

export const Config = {
	configureRenderer,
	setShadowHelper
}
