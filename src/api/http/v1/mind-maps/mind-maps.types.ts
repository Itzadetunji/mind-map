export interface GenerateMindMapPayload {
	prompt: string;
	userId?: string;
	projectId?: string;
	title?: string;
	currentCanvas?: {
		nodes?: unknown[];
		edges?: unknown[];
	};
}

export interface GenerateMindMapResponse {
	reasoning?: string;
	nodes: Array<{
		id: string;
		type: string;
		position: { x: number; y: number };
		data: Record<string, unknown>;
	}>;
	edges: Array<{
		id: string;
		source: string;
		target: string;
		label?: string;
		sourceHandle?: string;
	}>;
	projectId?: string;
	isOffTopic?: boolean;
}
