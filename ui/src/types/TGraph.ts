export type TGraphNodes = Record<string, TNodeInfo>

export type TNodeInfo = {
	position: THREE.Vector3
	layer_id?: string
	parentId?: string | null
}

export type TUserData = {
	id: string
	layerId: string
	parentId?: string | null
}
