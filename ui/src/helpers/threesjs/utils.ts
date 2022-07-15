import * as THREE from 'three'
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry.js'
import helveticaRegular from 'three/examples/fonts/helvetiker_regular.typeface.json'
import { Font } from 'three/examples/jsm/loaders/FontLoader'
import { Vector3 } from 'three'
const font = new Font(helveticaRegular)

const params = {
	font: font,
	size: 20,
	height: 0.2,
	curveSegments: 5,
	bevelEnabled: true,
	bevelThickness: 3,
	bevelSize: 0.1,
	bevelOffset: 0.4,
	bevelSegments: 5
}

const createText = (text: string) => {
	const geometry = new TextGeometry(text, params)
	return geometry
}

const buildText = (
	text: string,
	color: string,
	pos: Vector3,
	offsetY: number
) => {
	const textGeometry = createText(text)
	const textMaterial = new THREE.MeshPhongMaterial({ color })

	const mesh = new THREE.Mesh(textGeometry, textMaterial)
	//const size = text.length * 3
	mesh.rotateY(180)
	//mesh.position.set(pos.x + size / 2, pos.y + 15, pos.z)

	mesh.position.set(pos.x + 30, pos.y + offsetY + 20, pos.z - 30)

	return mesh
}

export const Utils = {
	buildText
}
