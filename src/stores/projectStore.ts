import type { Edge, Node } from "@xyflow/react";
import { create } from "zustand";
import type { MindMapProject } from "@/lib/database.types";

interface ProjectState {
	// Current project data
	project: MindMapProject | null;
	projectTitle: string;
	nodes: Node[];
	edges: Edge[];
	hasPrompt: boolean;

	// Actions
	setProject: (project: MindMapProject | null) => void;
	setProjectTitle: (title: string) => void;
	setNodes: (nodes: Node[]) => void;
	setEdges: (edges: Edge[]) => void;
	setHasPrompt: (hasPrompt: boolean) => void;
	updateGraphData: (nodes: Node[], edges: Edge[]) => void;
	reset: () => void;
}

const initialState = {
	project: null,
	projectTitle: "New Project",
	nodes: [] as Node[],
	edges: [] as Edge[],
	hasPrompt: false,
};

export const useProjectStore = create<ProjectState>((set) => ({
	...initialState,

	setProject: (project) =>
		set({
			project,
			projectTitle: project?.title || "New Project",
			hasPrompt: Boolean(project?.first_prompt?.trim()),
		}),

	setProjectTitle: (title) => set({ projectTitle: title }),

	setNodes: (nodes) => set({ nodes }),

	setEdges: (edges) => set({ edges }),

	setHasPrompt: (hasPrompt) => set({ hasPrompt }),

	updateGraphData: (nodes, edges) => set({ nodes, edges }),

	reset: () => set(initialState),
}));
