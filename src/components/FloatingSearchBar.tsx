import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useReactFlow } from "@xyflow/react";
import { Brain, Loader2, Send, Sparkles } from "lucide-react";
import { useState } from "react";
import { creditsQueryKeys, useUserCredits } from "@/hooks/api/credits.hooks";
import { generateMindMap } from "@/server/v1/generate-mind-map";
import { useAuthStore } from "@/stores/authStore";
import { InsufficientCreditsModal } from "./InsufficientCreditsModal";
import { AutoResizeTextarea } from "./shared/AutoResizeTextArea";
import { ErrorDialog } from "./shared/ErrorDialog";
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
	const [showCreditsModal, setShowCreditsModal] = useState(false);
	const [showErrorDialog, setShowErrorDialog] = useState(false);
	const [showOffTopicDialog, setShowOffTopicDialog] = useState(false);
	const { setNodes, setEdges, fitView } = useReactFlow();
	const user = useAuthStore((state) => state.user);
	const { data: credits } = useUserCredits();
	const queryClient = useQueryClient();

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
			// Refresh credits after successful generation
			queryClient.invalidateQueries({
				queryKey: creditsQueryKeys.balance(user?.id),
			});
			queryClient.invalidateQueries({
				queryKey: creditsQueryKeys.transactions(user?.id),
			});

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
			const errorMessage =
				error instanceof Error
					? error.message
					: typeof error === "string"
						? error
						: String(error);
			if (errorMessage.includes("INSUFFICIENT_CREDITS")) {
				setShowCreditsModal(true);
			} else if (errorMessage.includes("OFF_TOPIC_REQUEST")) {
				setShowOffTopicDialog(true);
			} else {
				setShowErrorDialog(true);
			}
		},
	});

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!prompt.trim()) return;

		// Check if user has enough credits (1 credit per generation)
		if (!credits || credits.credits < 1) {
			setShowCreditsModal(true);
			return;
		}

		// Start actual generation
		mutation.mutate(prompt);
	};

	return (
		<div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-50 w-full max-w-lg px-4">
			{/* Thinking Steps Panel */}
			{mutation.isPending && (
				<div className="mb-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-lg p-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
					<div className="flex items-center gap-2">
						<Brain className="w-4 h-4 text-primary dark:text-[#0077B6] animate-pulse" />
						<span className="text-sm font-medium text-slate-700 dark:text-slate-300">
							AI is thinking...
						</span>
					</div>
				</div>
			)}

			{/* Search Bar */}
			<form
				onSubmit={handleSubmit}
				className="relative flex items-center w-full shadow-lg rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 transition-all focus-within:ring-2 focus-within:ring-primary/20 dark:focus-within:ring-[#0077B6]/30 focus-within:ring-offset-2 dark:focus-within:ring-offset-slate-900 "
			>
				<div className="pl-4 text-slate-400">
					{mutation.isPending ? (
						<Loader2 className="w-5 h-5 animate-spin text-primary dark:text-[#0077B6]" />
					) : (
						<Sparkles className="w-5 h-5 text-primary dark:text-[#0077B6]" />
					)}
				</div>
				<AutoResizeTextarea
					value={prompt}
					onChange={(e) => setPrompt(e.target.value)}
					onKeyDown={(e) => {
						if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
							e.preventDefault();
							if (prompt.trim() && !mutation.isPending) {
								// Check credits before submitting
								if (!credits || credits.credits < 1) {
									setShowCreditsModal(true);
									return;
								}
								mutation.mutate(prompt);
							}
						}
					}}
					placeholder="Describe your app idea..."
					className="w-full bg-transparent p-3 h-fit! outline-none text-sm text-slate-900 max-h-20 dark:text-slate-100 placeholder:text-slate-500 border-none resize-none focus-visible:ring-0"
					disabled={mutation.isPending}
				/>
				<Button
					type="submit"
					disabled={!prompt.trim() || mutation.isPending}
					variant="ghost"
					size="icon"
					className="mr-1.5 rounded-full hover:bg-primary hover:text-white dark:hover:bg-[#0077B6] dark:hover:text-white"
				>
					<Send className="w-4 h-4" />
				</Button>
			</form>

			{/* Insufficient Credits Modal */}
			<InsufficientCreditsModal
				open={showCreditsModal}
				onOpenChange={setShowCreditsModal}
				currentCredits={credits?.credits ?? 0}
			/>

			{/* Error Dialog */}
			<ErrorDialog
				open={showErrorDialog}
				onOpenChange={setShowErrorDialog}
				title="Generation Failed"
				description="Failed to generate mind map. Please check the console for more details and try again."
			/>

			{/* Off-Topic Request Dialog */}
			<ErrorDialog
				open={showOffTopicDialog}
				onOpenChange={setShowOffTopicDialog}
				title="Request Not Supported"
				description="I can only help with designing app user flows and mind maps. Please describe an app idea, feature, or user flow you'd like me to create or modify."
			/>
		</div>
	);
}
