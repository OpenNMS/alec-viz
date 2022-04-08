export type TDataset = {
	vertices: TVertice[]
	edges: TEdge[]
}

export type TVertice = {
	id: string
	label: string
	type: string
	attributes: TAttribute
	layer_id: string
}

type TAttribute = {
	id: string
	severity: string
	updatedms: string
	iotype: string
	ioid: string
}

export type TEdge = {
	id: string
	label: string
	type: string
	source_id: string
	target_id: string
}

export type TLayer = {
	id: string
	label: string
	description: string
	order: string
}
