import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ProjectSelector } from "@/components/ProjectSelector";
import { useCreateMindMapProject } from "@/hooks/useMindMapProjects";
import type { MindMapProject } from "@/lib/database.types";
import { useAuthStore } from "@/stores/authStore";

const App = () => {
	const navigate = useNavigate();
	const { user, loading } = useAuthStore();
	const createMutation = useCreateMindMapProject();

	const handleSelectProject = (project: MindMapProject) => {
		navigate({ to: "/project/$projectId", params: { projectId: project.id } });
	};

	const handleNewProject = async () => {
		if (!user) return;

		try {
			// Create the project in Supabase first
			const newProject = await createMutation.mutateAsync({
				title: "New Project",
				description: null,
				prompt: "",
				graph_data: {
					nodes: [
						{
							id: "root",
							type: "core-concept",
							position: { x: 0, y: 0 },
							data: { label: "New Project" },
						},
					],
					edges: [],
				},
			});
			// Then navigate to the new project
			navigate({
				to: "/project/$projectId",
				params: { projectId: newProject.id },
			});
		} catch (error) {
			console.error("Failed to create project:", error);
		}
	};

	// Show loading state
	if (loading) {
		return (
			<main className="w-full flex-1 flex items-center justify-center">
				<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
			</main>
		);
	}

	return (
		<ProjectSelector
			onSelectProject={handleSelectProject}
			onNewProject={handleNewProject}
			isCreating={createMutation.isPending}
		/>
	);
};

export const Route = createFileRoute("/")({
	component: App,
});
