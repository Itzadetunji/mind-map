import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import MindMap from "@/components/MindMap";
import { ProjectSelector } from "@/components/ProjectSelector";
import type { MindMapProject } from "@/lib/database.types";
import { useAuthStore } from "@/stores/authStore";

type ViewState = "selector" | "editor";

const App = () => {
	const { user, loading } = useAuthStore();
	const [viewState, setViewState] = useState<ViewState>("selector");
	const [selectedProject, setSelectedProject] = useState<MindMapProject | null>(
		null,
	);
	const [showChatSidebar, setShowChatSidebar] = useState(false);

	const handleSelectProject = (project: MindMapProject) => {
		setSelectedProject(project);
		setViewState("editor");
	};

	const handleNewProject = () => {
		setSelectedProject(null);
		setViewState("editor");
	};

	const handleBackToProjects = () => {
		setSelectedProject(null);
		setViewState("selector");
		setShowChatSidebar(false);
	};

	// Show loading state
	if (loading) {
		return (
			<main className="w-full flex-1 flex items-center justify-center">
				<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
			</main>
		);
	}

	// Show project selector if not authenticated or in selector view
	if (!user || viewState === "selector") {
		return (
			<ProjectSelector
				onSelectProject={handleSelectProject}
				onNewProject={handleNewProject}
			/>
		);
	}

	// Show mind map editor
	return (
		<main className="w-full flex-1 relative">
			<div className="absolute top-2 left-4 z-20 flex items-center gap-2">
				<button
					type="button"
					onClick={handleBackToProjects}
					className="text-sm text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
				>
					← All Projects
				</button>
				{selectedProject && (
					<>
						<span className="text-slate-300 dark:text-slate-600">/</span>
						<span className="text-sm font-medium text-slate-900 dark:text-white truncate max-w-50">
							{selectedProject.title}
						</span>
					</>
				)}
			</div>
			<button
				type="button"
				onClick={() => setShowChatSidebar(!showChatSidebar)}
				className="absolute top-2 right-4 z-20 flex items-center gap-2 px-3 py-1.5 text-sm rounded-lg bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900 transition-colors"
			>
				💬 AI Chat
			</button>
			<MindMap
				project={selectedProject}
				showChatSidebar={showChatSidebar}
				onChatSidebarClose={() => setShowChatSidebar(false)}
			/>
		</main>
	);
};

export const Route = createFileRoute("/")({
	component: App,
});
