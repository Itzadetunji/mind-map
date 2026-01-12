import { useForm } from "@tanstack/react-form";
import { useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import type { Edge, Node } from "@xyflow/react";
import { useCallback, useEffect, useRef } from "react";
import MindMap from "@/components/MindMap";
import {
	useMindMapProject,
	useUpdateMindMapProject,
} from "@/hooks/useMindMapProjects";
import { useAuthStore } from "@/stores/authStore";

const AUTOSAVE_DELAY = 200; // 200ms debounce

const ProjectPage = () => {
	const { projectId } = Route.useParams();
	const navigate = useNavigate();
	const queryClient = useQueryClient();
	const { user, loading: authLoading } = useAuthStore();

	// Fetch project from Supabase
	const {
		data: project,
		isLoading: projectLoading,
		error: projectError,
	} = useMindMapProject(projectId);

	const updateMutation = useUpdateMindMapProject();
	const autosaveTimerRef = useRef<NodeJS.Timeout | null>(null);
	const isInitialLoadRef = useRef(true);

	// Track last saved state to detect actual changes
	const lastSavedStateRef = useRef<{
		title: string;
		nodes: string;
		edges: string;
	}>({ title: "", nodes: "[]", edges: "[]" });

	// Current state refs to avoid stale closures
	const currentNodesRef = useRef<Node[]>([]);
	const currentEdgesRef = useRef<Edge[]>([]);

	// TanStack Form for project title
	const form = useForm({
		defaultValues: {
			title: "New Project",
		},
	});

	// Update form and refs when project loads
	useEffect(() => {
		if (project && isInitialLoadRef.current) {
			form.setFieldValue("title", project.title);
			const nodes = (project.graph_data?.nodes as Node[]) || [];
			const edges = (project.graph_data?.edges as Edge[]) || [];
			currentNodesRef.current = nodes;
			currentEdgesRef.current = edges;
			lastSavedStateRef.current = {
				title: project.title,
				nodes: JSON.stringify(nodes),
				edges: JSON.stringify(edges),
			};
			isInitialLoadRef.current = false;
		}
	}, [project, form]);

	// Redirect to home on error
	useEffect(() => {
		if (projectError) {
			console.error("Failed to load project:", projectError);
			navigate({ to: "/" });
		}
	}, [projectError, navigate]);

	// Redirect if not authenticated
	useEffect(() => {
		if (!authLoading && !user) {
			navigate({ to: "/" });
		}
	}, [authLoading, user, navigate]);

	// Autosave function - only saves if there are actual changes
	const performAutosave = useCallback(async () => {
		if (!project?.id) return;

		const currentTitle = form.state.values.title;
		const currentNodesJson = JSON.stringify(currentNodesRef.current);
		const currentEdgesJson = JSON.stringify(currentEdgesRef.current);

		// Check if anything actually changed
		const titleChanged = currentTitle !== lastSavedStateRef.current.title;
		const nodesChanged = currentNodesJson !== lastSavedStateRef.current.nodes;
		const edgesChanged = currentEdgesJson !== lastSavedStateRef.current.edges;

		if (!titleChanged && !nodesChanged && !edgesChanged) {
			return; // No changes, skip save
		}

		try {
			await updateMutation.mutateAsync({
				id: project.id,
				title: currentTitle,
				graph_data: {
					...project.graph_data,
					nodes: currentNodesRef.current.map((n) => ({
						id: n.id,
						type: n.type || "custom-node",
						position: n.position,
						data: n.data as Record<string, unknown>,
					})),
					edges: currentEdgesRef.current.map((e) => ({
						id: e.id,
						source: e.source,
						target: e.target,
						label: typeof e.label === "string" ? e.label : undefined,
					})),
				},
			});
			// Update last saved state after successful save
			lastSavedStateRef.current = {
				title: currentTitle,
				nodes: currentNodesJson,
				edges: currentEdgesJson,
			};
		} catch (error) {
			console.error("Autosave failed:", error);
		}
	}, [project, form, updateMutation]);

	// Trigger autosave with debounce
	const triggerAutosave = useCallback(() => {
		if (autosaveTimerRef.current) {
			clearTimeout(autosaveTimerRef.current);
		}
		autosaveTimerRef.current = setTimeout(() => {
			performAutosave();
		}, AUTOSAVE_DELAY);
	}, [performAutosave]);

	// Cleanup timer on unmount
	useEffect(() => {
		return () => {
			if (autosaveTimerRef.current) {
				clearTimeout(autosaveTimerRef.current);
			}
		};
	}, []);

	// Handle nodes change from MindMap - update ref immediately, debounce save
	const handleNodesChange = useCallback(
		(nodes: Node[]) => {
			// Skip if this is just the initial load propagating
			if (isInitialLoadRef.current) return;

			const newNodesJson = JSON.stringify(nodes);
			const oldNodesJson = JSON.stringify(currentNodesRef.current);

			// Only trigger save if there's an actual change
			if (newNodesJson !== oldNodesJson) {
				currentNodesRef.current = nodes;
				triggerAutosave();
			}
		},
		[triggerAutosave],
	);

	// Handle edges change from MindMap
	const handleEdgesChange = useCallback(
		(edges: Edge[]) => {
			if (isInitialLoadRef.current) return;

			const newEdgesJson = JSON.stringify(edges);
			const oldEdgesJson = JSON.stringify(currentEdgesRef.current);

			if (newEdgesJson !== oldEdgesJson) {
				currentEdgesRef.current = edges;
				triggerAutosave();
			}
		},
		[triggerAutosave],
	);

	// Handle title change
	const handleTitleChange = useCallback(
		(title: string) => {
			form.setFieldValue("title", title);
			triggerAutosave();
		},
		[form, triggerAutosave],
	);

	const handleBackToProjects = () => {
		// Save any pending changes before leaving
		if (autosaveTimerRef.current) {
			clearTimeout(autosaveTimerRef.current);
			performAutosave();
		}
		navigate({ to: "/" });
	};

	// Handle when the first prompt is submitted
	const handlePromptSubmitted = useCallback(() => {
		// Invalidate the project query to refresh data (including prompt field)
		queryClient.invalidateQueries({ queryKey: ["mindMapProject", projectId] });
	}, [queryClient, projectId]);

	// Show loading state
	if (authLoading || projectLoading) {
		return (
			<main className="w-full flex-1 flex items-center justify-center">
				<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
			</main>
		);
	}

	if (!project) {
		return null;
	}

	// Determine if project has a prompt (first AI interaction done)
	const hasPrompt = Boolean(project.prompt?.trim());

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
				<span className="text-slate-300 dark:text-slate-600">/</span>
				<form.Field name="title">
					{(field) => (
						<input
							type="text"
							value={field.state.value}
							onChange={(e) => handleTitleChange(e.target.value)}
							onBlur={field.handleBlur}
							className="text-sm font-medium text-slate-900 dark:text-white bg-transparent border-none outline-none focus:ring-0 max-w-50 truncate hover:bg-slate-100 dark:hover:bg-slate-800 px-2 py-0.5 rounded transition-colors"
							placeholder="Project name..."
						/>
					)}
				</form.Field>
				{updateMutation.isPending && (
					<span className="text-xs text-slate-400">Saving...</span>
				)}
			</div>
			<MindMap
				project={project}
				projectTitle={form.state.values.title}
				onNodesChange={handleNodesChange}
				onEdgesChange={handleEdgesChange}
				onProjectTitleChange={handleTitleChange}
				hasPrompt={hasPrompt}
				onPromptSubmitted={handlePromptSubmitted}
			/>
		</main>
	);
};

export const Route = createFileRoute("/project/$projectId")({
	component: ProjectPage,
});
