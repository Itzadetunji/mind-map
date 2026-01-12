export interface MindMapProject {
	id: string;
	user_id: string;
	title: string;
	description: string | null;
	prompt: string;
	graph_data: {
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
		}>;
	};
	created_at: string;
	updated_at: string;
}

export interface ChatMessage {
	id: string;
	project_id: string;
	role: "user" | "assistant";
	content: string;
	thinking_steps?: string[];
	created_at: string;
}

export interface Database {
	public: {
		Tables: {
			mind_map_projects: {
				Row: MindMapProject;
				Insert: Omit<MindMapProject, "id" | "created_at" | "updated_at">;
				Update: Partial<Omit<MindMapProject, "id" | "created_at">>;
			};
			chat_messages: {
				Row: ChatMessage;
				Insert: Omit<ChatMessage, "id" | "created_at">;
				Update: Partial<Omit<ChatMessage, "id" | "created_at">>;
			};
		};
	};
}
