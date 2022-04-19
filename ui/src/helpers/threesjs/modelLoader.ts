import { MeshStandardMaterial, Mesh } from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
const loader = new GLTFLoader()
const models: Record<string, THREE.Group> = {}
import CONST from '@/helpers/constants'

const loadModelDevice = async () => {
	const size = CONST.DEVICE_SCALE
	const glb = await loader.loadAsync('/src/assets/device_v07.glb')
	glb.scene.traverse((obj) => {
		// eslint-disable-next-line @typescript-eslint/ban-ts-comment
		//@ts-ignore
		if (obj.isMesh) {
			const mesh = obj as Mesh
			mesh.castShadow = true
			mesh.geometry.scale(size, size, size)
			const materials = (
				Array.isArray(mesh.material) ? mesh.material : [mesh.material]
			) as MeshStandardMaterial[]
			materials.forEach((mat: MeshStandardMaterial) => (mat.metalness = 0))
		}
	})
	models.device = glb.scene
}

const getModelDevice = async () => {
	if (!models.device) {
		await loadModelDevice()
	}
	return models.device
}

export const Loaders = {
	getModelDevice
}
