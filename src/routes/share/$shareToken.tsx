import { createFileRoute, Link } from "@tanstack/react-router";
import type { Edge, Node } from "@xyflow/react";
import { useEffect, useState } from "react";
import { MindMap } from "@/components/MindMap";
import { Button } from "@/components/ui/button";
import type { MindMapProject } from "@/lib/database.types";
import { getSharedMindMap } from "@/server/v1/share-links";
import { useAuthStore } from "@/stores/authStore";

const SharedMindMapPage = () => {
	const { shareToken } = Route.useParams();
	const [mindMap, setMindMap] = useState<MindMapProject | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const { signInWithGoogle } = useAuthStore();

	useEffect(() => {
		const fetchSharedMindMap = async () => {
			try {
				setLoading(true);
				const result = await getSharedMindMap({
					data: { shareToken },
				});

				// Transform the result to match MindMapProject format
				const transformedMindMap: MindMapProject = {
					id: result.mindMap.id,
					user_id: "",
					title: result.mindMap.title,
					description: result.mindMap.description,
					first_prompt: "",
					graph_data: result.mindMap.graph_data as {
						reasoning?: string;
						nodes: Node[];
						edges: Edge[];
					},
					created_at: "",
					updated_at: "",
				};

				setMindMap(transformedMindMap);
			} catch (err) {
				setError(
					err instanceof Error ? err.message : "Failed to load shared mind map",
				);
			} finally {
				setLoading(false);
			}
		};

		if (shareToken) {
			fetchSharedMindMap();
		}
	}, [shareToken]);

	if (loading) {
		return (
			<div className="min-h-screen w-full flex items-center justify-center bg-white dark:bg-black">
				<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary dark:border-[#0077B6]" />
			</div>
		);
	}

	if (error || !mindMap) {
		return (
			<div className="min-h-screen w-full flex items-center justify-center bg-white dark:bg-black">
				<div className="text-center space-y-4">
					<h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
						Mind Map Not Found
					</h1>
					<p className="text-slate-600 dark:text-slate-400">
						{error || "The shared mind map could not be loaded."}
					</p>
					<Button onClick={() => (window.location.href = "/")}>
						Go to Home
					</Button>
				</div>
			</div>
		);
	}

	return (
		<div className="min-h-screen w-full flex flex-col bg-white dark:bg-black">
			{/* Unique Header for Shared View */}
			<header className="sticky top-0 p-4 flex items-center justify-between bg-white text-black border-b border-gray-200 z-10 dark:bg-black dark:text-white dark:border-gray-800">
				<div className="flex items-center gap-4">
					<div className="flex items-center gap-2">
						<img
							src="/assets/brand/logo-white.png"
							alt="Proto Map"
							className="w-8 h-8"
						/>
						<h1 className="text-xl font-semibold">
							<Link to="/">Proto Map</Link>
						</h1>
					</div>
					<span className="text-slate-300 dark:text-slate-600">/</span>
					<span className="text-slate-600 dark:text-slate-400 truncate max-w-md">
						{mindMap.title}
					</span>
					<span className="text-xs text-slate-400 dark:text-slate-500 px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded">
						View Only
					</span>
				</div>
				<Button
					onClick={signInWithGoogle}
					className="bg-primary hover:bg-primary/90 dark:bg-[#0077B6] dark:hover:bg-[#0077B6]/90 text-white"
				>
					Login to Edit
				</Button>
			</header>

			{/* Read-only Mind Map */}
			<main className="flex-1 relative">
				<MindMap
					project={mindMap}
					onNodesChange={() => {}} // No-op for read-only
					onEdgesChange={() => {}} // No-op for read-only
					hasPrompt={false}
					readOnly={true}
				/>
			</main>
		</div>
	);
};

export const Route = createFileRoute("/share/$shareToken")({
	component: SharedMindMapPage,
});
