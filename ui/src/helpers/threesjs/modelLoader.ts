import { MeshStandardMaterial, Mesh, MeshPhysicalMaterial, Color } from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
const loader = new GLTFLoader()
const models: Record<string, THREE.Group> = {}
const alarms: Record<string, THREE.Group> = {}
const situations: Record<string, THREE.Group> = {}
const dataCenters: Record<string, THREE.Group> = {}
const racks: Record<string, THREE.Group> = {}
let rack: THREE.Group
const servers: Record<string, THREE.Group> = {}
let server: THREE.Group
import CONST from '@/helpers/constants'
import THREE from 'three'
import { forEach, map } from 'lodash'

const alarmSeverityPaths: Record<string, string> = {
	critical: 'alarm_red',
	major: 'alarm_orange',
	minor: 'alarm_yellow',
	warning: 'alarm_yellow',
	normal: 'alarm_green',
	cleared: 'alarm_blue2',
	indeterminate: 'alarm_white'
}

const situationSeverityPaths: Record<string, string> = {
	critical: 'situation_red',
	major: 'situation_red_low',
	minor: 'situation_orange',
	warning: 'situation_yellow',
	normal: 'situation_green',
	cleared: 'situation_blue',
	indeterminate: 'situation_blue'
}

const severities = ['red', 'blue', 'yellow', 'orange', 'green']

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

const loadModelSituation = async (severity: string) => {
	const size = 7

	const glb = await loader.loadAsync(
		`/src/assets/situations/${situationSeverityPaths[severity]}.glb`
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
				}
			)
		}
	})
	situations[severity] = glb.scene
}

const loadModelDatacenter = async (severity: string) => {
	const size = 7

	const glb = await loader.loadAsync(
		`/src/assets/bigData2/datacenter_${severity}.glb`
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
	dataCenters[severity] = glb.scene
}

const loadModelRacks = async (severity: string) => {
	const size = 7

	const glb = await loader.loadAsync(
		`/src/assets/bigData2/rack_${severity}.glb`
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
	racks[severity] = glb.scene
}

const loadModelServer = async (severity: string) => {
	const size = 7

	const glb = await loader.loadAsync(
		`/src/assets/bigData2/server_${severity}.glb`
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
			materials.forEach((mat) => (mat.metalness = 0))
		}
	})
	servers[severity] = glb.scene
}

const loadModel = async (url) => {
	const size = 7

	const glb = await loader.loadAsync(url)

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
					mat.roughness = 0.5
					mat.refractionRatio = 0.1
					mat.emissive = new Color('rgb(30, 30, 30)')
					//mat.emissiveIntensity = 0.8
					mat.aoMapIntensity = 0
				}
			)
		}
	})
	return glb.scene
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

const getModelSituation = (): Record<string, THREE.Group> => {
	return situations
}

const getModelDataCenters = (): Record<string, THREE.Group> => {
	return dataCenters
}

const getModelRacks = (): Record<string, THREE.Group> => {
	return racks
}

const getModelRack = (): THREE.Group => {
	return rack
}

const getModelServer = (): THREE.Group => {
	return server
}

const initPreLoad = async () => {
	models.device = await loadModelDevice()
	models.parentDevice = await loadModelDevice(2.8)
	server = await loadModel('/src/assets/bigData3/server7.glb')
	rack = await loadModel('/src/assets/bigData3/rack5.glb')

	forEach(alarmSeverityPaths, async (path, severity) => {
		await loadModelAlarm(severity)
	})
	forEach(situationSeverityPaths, async (path, severity) => {
		await loadModelSituation(severity)
	})
	forEach(severities, async (severity) => {
		await loadModelDatacenter(severity)
	})
	/*forEach(severities, async (severity) => {
		await loadModelRacks(severity)
	})
	forEach(severities, async (severity) => {
		await loadModelServer(severity)
	})*/
}

await initPreLoad()

export const Loaders = {
	getModelParentDevice,
	getModelDevice,
	getModelAlarm,
	getModelSituation,
	getModelDataCenters,
	getModelRacks,
	//getModelServers,
	getModelServer,
	getModelRack
}
