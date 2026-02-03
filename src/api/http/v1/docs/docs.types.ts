export interface GenerateDocsPayload {
	projectTitle: string;
	firstPrompt?: string;
	nodes: unknown[];
	edges: unknown[];
	format?: "readme" | "prd";
}

export interface GenerateDocsResponse {
	format: "readme" | "prd";
	content: string;
	filename: string;
}
