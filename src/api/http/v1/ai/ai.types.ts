export interface ChatInput {
	message: string;
	userId?: string;
	projectId?: string;
	projectContext?: {
		title: string;
		prompt: string;
		nodes: unknown[];
		edges: unknown[];
	};
	chatHistory?: Array<{ role: "user" | "assistant"; content: string }>;
	isFirstMessage?: boolean;
}

export interface ChatResponse {
	thinking: {
		task: string;
		context: string;
		references: string;
		evaluation: string;
		iteration: string;
	};
	message: string;
	action: "generate" | "modify" | "none";
	graphData: {
		nodes: Array<Record<string, unknown>>;
		edges: Array<Record<string, unknown>>;
	} | null;
	streamingSteps?: Array<{
		step: string;
		content: string;
		completed: boolean;
	}>;
}
