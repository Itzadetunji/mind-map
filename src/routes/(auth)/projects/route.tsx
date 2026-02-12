import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useLayoutEffect, useState } from "react";
import { toast } from "sonner";

import { useUserSubscription } from "@/api/http/v1/credits/credits.hooks";
import {
	useCreateMindMapProject,
	useMindMapProjects,
} from "@/api/http/v1/mind-maps/mind-maps.hooks";
import { FREE_TIER_MAX_PROJECTS } from "@/lib/constants";
import type { MindMapProject } from "@/lib/database.types";
import { SubscriptionModal } from "@/routes/(auth)/account/-components/SubscriptionModal";
import { ProjectSelector } from "@/routes/(auth)/projects/-components/ProjectSelector";
import { DodoSubscriptionDataStatuses } from "@/routes/v1/dodo/subscription-webhook";

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
		const tier = userSubscriptionQuery.data?.tier ?? "free";
		const isFreeTier = tier === "free";
		const isPro = tier === "pro";
		const projectCount = projects?.length ?? 0;

		// Free tier: max 3 projects
		if (isFreeTier && projectCount >= FREE_TIER_MAX_PROJECTS) {
			setShowSubscriptionModal(true);
			return;
		}

		// Hobby: max 20 projects
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
			console.error("Error creating project:", error);
		}
	};

	useLayoutEffect(() => {
		if (
			userSubscriptionQuery.data &&
			userSubscriptionQuery.data.dodo_status !==
				DodoSubscriptionDataStatuses.ACTIVE
		) {
			setShowSubscriptionModal(true);
		}
	}, [userSubscriptionQuery.data]);

	const isFreeTier =
		!userSubscriptionQuery.data?.tier ||
		userSubscriptionQuery.data.tier === "free";
	const projectCount = projects?.length ?? 0;
	const freeTierAtLimit =
		isFreeTier && projectCount >= FREE_TIER_MAX_PROJECTS;
	const canCreateNewProject = !freeTierAtLimit;

	return (
		<>
			<ProjectSelector
				onSelectProject={handleSelectProject}
				onNewProject={handleNewProject}
				isCreating={createMutation.isPending}
				canCreateNewProject={canCreateNewProject}
				createLimitMessage={
					freeTierAtLimit
						? `Free tier is limited to ${FREE_TIER_MAX_PROJECTS} projects. Upgrade to create more.`
						: undefined
				}
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
