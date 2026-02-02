import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useLayoutEffect, useState } from "react";
import { toast } from "sonner";

import { ProjectSelector } from "@/components/ProjectSelector";
import { SubscriptionModal } from "@/components/SubscriptionModal";
import { useUserSubscription } from "@/hooks/credits.hooks";
import {
	useCreateMindMapProject,
	useMindMapProjects,
} from "@/hooks/mind-maps.hooks";
import type { MindMapProject } from "@/lib/database.types";

const ProjectsPage = () => {
	const navigate = useNavigate();
	const createMutation = useCreateMindMapProject();
	const { data: projects } = useMindMapProjects();
	const userSubscriptionQuery = useUserSubscription();
	const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);

	const handleSelectProject = (project: MindMapProject) => {
		navigate({ to: "/project/$projectId", params: { projectId: project.id } });
	};

	const handleNewProject = async () => {
		// Check subscription status
		const isSubscribed =
			userSubscriptionQuery.data?.tier &&
			userSubscriptionQuery.data.tier !== "free";

		if (!isSubscribed) {
			setShowSubscriptionModal(true);
			return;
		}

		// Check subscription limits
		const isPro = userSubscriptionQuery.data?.tier === "pro";
		const projectCount = projects?.length ?? 0;

		if (!isPro && projectCount >= 20) {
			toast.error("Project limit reached", {
				description:
					"Hobby plan is limited to 20 projects. Please upgrade to Pro for unlimited projects.",
			});
			navigate({ to: "/account" });
			return;
		}

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

	useLayoutEffect(() => {
		if (userSubscriptionQuery.data?.tier === "free") {
			setShowSubscriptionModal(true);
		}
	}, [userSubscriptionQuery.data]);

	return (
		<>
			<ProjectSelector
				onSelectProject={handleSelectProject}
				onNewProject={handleNewProject}
				isCreating={createMutation.isPending}
			/>
			<SubscriptionModal
				open={showSubscriptionModal}
				onOpenChange={setShowSubscriptionModal}
			/>
		</>
	);
};

export const Route = createFileRoute("/(auth)/projects")({
	component: ProjectsPage,
});
