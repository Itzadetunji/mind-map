import { useMutation } from "@tanstack/react-query";
import { useReactFlow } from "@xyflow/react";
import { Loader2, Search, Sparkles } from "lucide-react";
import { useState } from "react";
import { generateMindMap } from "@/server/generate-mind-map";

export function FloatingSearchBar() {
	const [prompt, setPrompt] = useState("");
	const { setNodes, setEdges, fitView } = useReactFlow();

	const mutation = useMutation({
		mutationFn: async (text: string) => {
			return await generateMindMap({ data: { prompt: text } });
		},
		onSuccess: (data) => {
			if (data?.nodes && data?.edges) {
				setNodes(data.nodes);
				setEdges(data.edges);
				setTimeout(() => fitView(), 100);
			}
		},
		onError: (error) => {
			console.error("Failed to generate:", error);
			alert("Failed to generate mind map. Check console.");
		},
	});

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		if (!prompt.trim()) return;
		mutation.mutate(prompt);
	};

	return (
		<div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 w-full max-w-lg px-4">
			<form
				onSubmit={handleSubmit}
				className="relative flex items-center w-full shadow-lg rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 transition-all focus-within:ring-2 focus-within:ring-slate-400 dark:focus-within:ring-slate-600 focus-within:ring-offset-2 dark:focus-within:ring-offset-slate-900"
			>
				<div className="pl-4 text-slate-400">
					{mutation.isPending ? (
						<Loader2 className="w-5 h-5 animate-spin text-blue-500" />
					) : (
						<Sparkles className="w-5 h-5 text-indigo-500" />
					)}
				</div>
				<input
					type="text"
					value={prompt}
					onChange={(e) => setPrompt(e.target.value)}
					placeholder="Describe your mind map..."
					className="w-full bg-transparent px-3 py-3 outline-none text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-500"
					disabled={mutation.isPending}
				/>
				<button
					type="submit"
					disabled={!prompt.trim() || mutation.isPending}
					className="mr-1.5 p-2 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 transition-colors disabled:opacity-50"
				>
					<Search className="w-4 h-4" />
				</button>
			</form>
		</div>
	);
}
