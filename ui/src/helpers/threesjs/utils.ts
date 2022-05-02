import * as THREE from 'three'
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry.js'
import helveticaRegular from 'three/examples/fonts/helvetiker_regular.typeface.json'
import { Font } from 'three/examples/jsm/loaders/FontLoader'
import { Vector3 } from 'three'
const font = new Font(helveticaRegular)

const params = {
	font: font,
	size: 3.5,
	height: 0.2,
	curveSegments: 5,
	bevelEnabled: true,
	bevelThickness: 0.01,
	bevelSize: 0.01,
	bevelOffset: 0,
	bevelSegments: 5
}

const createText = (text: string) => {
	const geometry = new TextGeometry(text, params)
	return geometry
}

const buildText = (text: string, pos: Vector3) => {
	const textGeometry = createText(text)
	const textMaterial = new THREE.MeshPhongMaterial({ color: 0xff0000 })

	const mesh = new THREE.Mesh(textGeometry, textMaterial)
	const size = text.length * 3
	mesh.rotateY(-110)
	mesh.position.set(pos.x + size / 2, pos.y + 15, pos.z)
	return mesh
}

export const Utils = {
	buildText
}
