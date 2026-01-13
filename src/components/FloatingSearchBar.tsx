import { useMutation } from "@tanstack/react-query";
import { useReactFlow } from "@xyflow/react";
import { Brain, Loader2, Search, Sparkles } from "lucide-react";
import { useState } from "react";
import { generateMindMap } from "@/server/generate-mind-map";
import { useAuthStore } from "@/stores/authStore";
import { AutoResizeTextarea } from "./shared/AutoResizeTextArea";
import { Button } from "./ui/button";

interface FloatingSearchBarProps {
	projectId?: string;
	onProjectCreated?: (projectId: string) => void;
}

export function FloatingSearchBar({
	projectId,
	onProjectCreated,
}: FloatingSearchBarProps) {
	const [prompt, setPrompt] = useState("");
	const { setNodes, setEdges, fitView } = useReactFlow();
	const user = useAuthStore((state) => state.user);

	const mutation = useMutation({
		mutationFn: async (text: string) => {
			return await generateMindMap({
				data: {
					prompt: text,
					userId: user?.id,
					projectId,
				},
			});
		},
		onSuccess: (data) => {
			// Mark all steps as completed

			setTimeout(() => {
				if (data?.nodes && data?.edges) {
					setNodes(data.nodes);
					setEdges(data.edges);
					setTimeout(() => fitView(), 100);
				}

				// If a new project was created, notify parent
				if (data?.projectId && onProjectCreated) {
					onProjectCreated(data.projectId);
				}
			}, 500);
		},
		onError: (error) => {
			console.error("Failed to generate:", error);
			alert("Failed to generate mind map. Check console.");
		},
	});

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!prompt.trim()) return;

		// Start actual generation
		mutation.mutate(prompt);
	};

	return (
		<div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-50 w-full max-w-lg px-4">
			{/* Thinking Steps Panel */}
			{mutation.isPending && (
				<div className="mb-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-lg p-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
					<div className="flex items-center gap-2">
						<Brain className="w-4 h-4 text-indigo-500 animate-pulse" />
						<span className="text-sm font-medium text-slate-700 dark:text-slate-300">
							AI is thinking...
						</span>
					</div>
				</div>
			)}

			{/* Search Bar */}
			<form
				onSubmit={handleSubmit}
				className="relative flex items-center w-full shadow-lg rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 transition-all focus-within:ring-2 focus-within:ring-slate-400 dark:focus-within:ring-slate-600 focus-within:ring-offset-2 dark:focus-within:ring-offset-slate-900 "
			>
				<div className="pl-4 text-slate-400">
					{mutation.isPending ? (
						<Loader2 className="w-5 h-5 animate-spin text-indigo-500" />
					) : (
						<Sparkles className="w-5 h-5 text-indigo-500" />
					)}
				</div>
				<AutoResizeTextarea
					value={prompt}
					onChange={(e) => setPrompt(e.target.value)}
					placeholder="Describe your app idea..."
					className="w-full bg-transparent p-3 h-fit! outline-none text-sm text-slate-900 max-h-20 dark:text-slate-100 placeholder:text-slate-500 border-none resize-none focus-visible:ring-0"
					disabled={mutation.isPending}
				/>
				<Button
					type="submit"
					disabled={!prompt.trim() || mutation.isPending}
					className="mr-1.5 p-2 size-fit rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 transition-colors disabled:opacity-50"
				>
					<Search className="w-4 h-4" />
				</Button>
			</form>
		</div>
	);
}
