import { useMutation } from "@tanstack/react-query";
import { useReactFlow } from "@xyflow/react";
import {
	Brain,
	CheckCircle2,
	Circle,
	Loader2,
	Search,
	Sparkles,
	X,
} from "lucide-react";
import { useState } from "react";
import { generateMindMap } from "@/server/generate-mind-map";
import { useAuthStore } from "@/stores/authStore";

interface ThinkingStep {
	step: string;
	status: "pending" | "active" | "completed";
}

const THINKING_STEPS: ThinkingStep[] = [
	{ step: "Understanding your task", status: "pending" },
	{ step: "Gathering context & references", status: "pending" },
	{ step: "Mapping to design patterns", status: "pending" },
	{ step: "Evaluating developer-friendliness", status: "pending" },
	{ step: "Iterating with Tree-of-Thoughts", status: "pending" },
	{ step: "Generating mind map", status: "pending" },
];

interface FloatingSearchBarProps {
	projectId?: string;
	onProjectCreated?: (projectId: string) => void;
}

export function FloatingSearchBar({
	projectId,
	onProjectCreated,
}: FloatingSearchBarProps) {
	const [prompt, setPrompt] = useState("");
	const [thinkingSteps, setThinkingSteps] = useState<ThinkingStep[]>([]);
	const [isThinking, setIsThinking] = useState(false);
	const { setNodes, setEdges, fitView } = useReactFlow();
	const user = useAuthStore((state) => state.user);

	const simulateThinking = async () => {
		setIsThinking(true);
		const steps = [...THINKING_STEPS];
		setThinkingSteps(steps);

		for (let i = 0; i < steps.length; i++) {
			if (i > 0) {
				steps[i - 1].status = "completed";
			}
			steps[i].status = "active";
			setThinkingSteps([...steps]);

			// Variable delay to feel more natural
			const delay = i === steps.length - 1 ? 500 : 600 + Math.random() * 400;
			await new Promise((r) => setTimeout(r, delay));
		}
	};

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
			setThinkingSteps((prev) =>
				prev.map((s) => ({ ...s, status: "completed" as const })),
			);

			setTimeout(() => {
				setIsThinking(false);
				setThinkingSteps([]);

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
			setIsThinking(false);
			setThinkingSteps([]);
			console.error("Failed to generate:", error);
			alert("Failed to generate mind map. Check console.");
		},
	});

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!prompt.trim()) return;

		// Start thinking animation
		simulateThinking();

		// Start actual generation
		mutation.mutate(prompt);
	};

	const handleCancel = () => {
		setIsThinking(false);
		setThinkingSteps([]);
	};

	return (
		<div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-50 w-full max-w-lg px-4">
			{/* Thinking Steps Panel */}
			{isThinking && thinkingSteps.length > 0 && (
				<div className="mb-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-lg p-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
					<div className="flex items-center justify-between mb-3">
						<div className="flex items-center gap-2">
							<Brain className="w-4 h-4 text-indigo-500 animate-pulse" />
							<span className="text-sm font-medium text-slate-700 dark:text-slate-300">
								AI is thinking...
							</span>
						</div>
						<button
							type="button"
							onClick={handleCancel}
							className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800"
						>
							<X className="w-4 h-4 text-slate-400" />
						</button>
					</div>
					<div className="space-y-2">
						{thinkingSteps.map((step) => (
							<div
								key={step.step}
								className={`flex items-center gap-2 text-sm transition-all duration-300 ${
									step.status === "completed"
										? "text-green-600 dark:text-green-400"
										: step.status === "active"
											? "text-indigo-600 dark:text-indigo-400"
											: "text-slate-400"
								}`}
							>
								{step.status === "completed" ? (
									<CheckCircle2 className="w-4 h-4 shrink-0" />
								) : step.status === "active" ? (
									<Loader2 className="w-4 h-4 animate-spin shrink-0" />
								) : (
									<Circle className="w-4 h-4 shrink-0" />
								)}
								<span className={step.status === "active" ? "font-medium" : ""}>
									{step.step}
								</span>
							</div>
						))}
					</div>
				</div>
			)}

			{/* Search Bar */}
			<form
				onSubmit={handleSubmit}
				className="relative flex items-center w-full shadow-lg rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 transition-all focus-within:ring-2 focus-within:ring-slate-400 dark:focus-within:ring-slate-600 focus-within:ring-offset-2 dark:focus-within:ring-offset-slate-900"
			>
				<div className="pl-4 text-slate-400">
					{mutation.isPending || isThinking ? (
						<Loader2 className="w-5 h-5 animate-spin text-indigo-500" />
					) : (
						<Sparkles className="w-5 h-5 text-indigo-500" />
					)}
				</div>
				<input
					type="text"
					value={prompt}
					onChange={(e) => setPrompt(e.target.value)}
					placeholder="Describe your app idea..."
					className="w-full bg-transparent px-3 py-3 outline-none text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-500"
					disabled={mutation.isPending || isThinking}
				/>
				<button
					type="submit"
					disabled={!prompt.trim() || mutation.isPending || isThinking}
					className="mr-1.5 p-2 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 transition-colors disabled:opacity-50"
				>
					<Search className="w-4 h-4" />
				</button>
			</form>
		</div>
	);
}
