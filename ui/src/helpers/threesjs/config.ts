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

export const Config = {
  configureRenderer
}
