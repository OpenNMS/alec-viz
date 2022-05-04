import { MeshStandardMaterial, Mesh, MeshPhysicalMaterial } from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
const loader = new GLTFLoader()
const models: Record<string, THREE.Group> = {}
const alarms: Record<string, THREE.Group> = {}
import CONST from '@/helpers/constants'
import THREE from 'three'
import { forEach } from 'lodash'

const alarmSeverityPaths: Record<string, string> = {
	critical: 'alarm_red',
	major: 'alarm_orange',
	minor: 'alarm_yellow',
	warning: 'alarm_yellow',
	normal: 'alarm_green',
	cleared: 'alarm_blue2',
	indeterminate: 'alarm_white'
}

const loadModelDevice = async (size = CONST.DEVICE_SCALE) => {
	const glb = await loader.loadAsync('/src/assets/device_v09.glb')
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
			materials.forEach((mat: MeshStandardMaterial) => {
				mat.metalness = 0
			})
		}
	})

	return glb.scene
}

const loadModelAlarm = async (severity: string) => {
	const size = CONST.ALARM_SIZE

	const glb = await loader.loadAsync(
		`/src/assets/alarm3/${alarmSeverityPaths[severity]}.glb`
	)
	glb.scene.traverse((obj) => {
		// eslint-disable-next-line @typescript-eslint/ban-ts-comment
		//@ts-ignore
		if (obj.isMesh) {
			const mesh = obj as Mesh
			mesh.castShadow = true
			mesh.geometry.scale(size, size, size)

			const materials = (
				Array.isArray(mesh.material) ? mesh.material : [mesh.material]
			) as MeshStandardMaterial[] | MeshPhysicalMaterial[]
			materials.forEach(
				(mat: THREE.MeshStandardMaterial | THREE.MeshPhysicalMaterial) => {
					mat.metalness = 0
					mat.roughness = 0
					mat.emissiveIntensity = 1
				}
			)
		}
	})
	alarms[severity] = glb.scene
}

const getModelDevice = () => {
	return models.device
}

const getModelParentDevice = () => {
	return models.parentDevice
}

const getModelAlarm = (): Record<string, THREE.Group> => {
	return alarms
}

const initPreLoad = async () => {
	models.device = await loadModelDevice()
	models.parentDevice = await loadModelDevice(2.8)
	forEach(alarmSeverityPaths, async (path, severity) => {
		await loadModelAlarm(severity)
	})
}

await initPreLoad()

export const Loaders = {
	getModelParentDevice,
	getModelDevice,
	getModelAlarm
}
