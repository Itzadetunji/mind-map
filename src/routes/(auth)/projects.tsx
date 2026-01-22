import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ProjectSelector } from "@/components/ProjectSelector";
import { useCreateMindMapProject } from "@/hooks/mind-maps.hooks";
import type { MindMapProject } from "@/lib/database.types";

const ProjectsPage = () => {
	const navigate = useNavigate();
	const createMutation = useCreateMindMapProject();

	const handleSelectProject = (project: MindMapProject) => {
		navigate({ to: "/project/$projectId", params: { projectId: project.id } });
	};

	const handleNewProject = async () => {
		try {
			// Create the project in Supabase first
			const newProject = await createMutation.mutateAsync({
				title: "New Project",
				description: null,
				first_prompt: "",
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

	return (
		<ProjectSelector
			onSelectProject={handleSelectProject}
			onNewProject={handleNewProject}
			isCreating={createMutation.isPending}
		/>
	);
};

export const Route = createFileRoute("/(auth)/projects")({
	component: ProjectsPage,
});
