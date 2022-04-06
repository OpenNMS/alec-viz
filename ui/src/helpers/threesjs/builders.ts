import * as THREE from 'three'
const BASE_HEIGHT = 0.2

const createConnection = (
  origin: THREE.Vector3,
  destination: THREE.Vector3,
  sceneRef: THREE.Scene
) => {
  const desplY = new THREE.Vector3().copy(origin).setY(BASE_HEIGHT).setX(1)
  const desplX = new THREE.Vector3().copy(desplY).setX(destination.x)
  const desplZ = new THREE.Vector3().copy(desplX).setZ(destination.z)

  const curve1 = new THREE.LineCurve3(desplY, desplX)
  const curve2 = new THREE.LineCurve3(desplX, desplZ)
  const curve3 = new THREE.LineCurve3(desplZ, destination)
  const curves = new THREE.CurvePath<THREE.Vector3>()
  curves.add(curve1)
  curves.add(curve2)
  curves.add(curve3)
  const geometry = new THREE.TubeGeometry(curves, 400, 0.1, 100, false)
  const material = new THREE.MeshBasicMaterial({ color: '#707B7C' })
  const mesh = new THREE.Mesh(geometry, material)
  mesh.castShadow = true
  sceneRef.add(mesh)
}

export const Builders = {
  createConnection
}
