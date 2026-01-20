import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { Edge, Node } from "@xyflow/react";
import {
	Bot,
	Brain,
	ChevronRight,
	Loader2,
	Send,
	Sparkles,
	X,
	Zap,
} from "lucide-react";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import { useChatHistory, useSendChatMessage } from "@/hooks/chats.hooks";
import { useUserCredits } from "@/hooks/credits.hooks";
import type { MindMapProject } from "@/lib/database.types";
import { formatTime } from "@/lib/date-utils";
import { chatWithAIStreaming } from "@/server/ai-updates-nodes";
import { useAuthStore } from "@/stores/authStore";
import { useProjectStore } from "@/stores/projectStore";
import { AutoResizeTextarea } from "./shared/AutoResizeTextArea";
import { InsufficientCreditsModal } from "./InsufficientCreditsModal";
import { Button } from "./ui/button";
import { Skeleton } from "./ui/skeleton";

interface AIThinking {
	task: string;
	context: string;
	references: string;
	evaluation: string;
	iteration: string;
}

interface ChatMessage {
	id: string;
	role: "user" | "assistant";
	content: string;
	thinking?: AIThinking;
	hasGraphUpdate?: boolean;
	timestamp: Date;
}

interface AIChatSidebarProps {
	isOpen: boolean;
	onClose: () => void;
	project: MindMapProject | null;
	nodes: Node[];
	edges: Edge[];
	onApplyChanges?: (nodes: Node[], edges: Edge[]) => void;
}

export const AIChatSidebar = ({
	isOpen,
	onClose,
	project,
	nodes,
	edges,
	onApplyChanges,
}: AIChatSidebarProps) => {
	const { projectTitle, setProjectTitle } = useProjectStore();
	const { user } = useAuthStore();
	const { data: credits } = useUserCredits();
	const [showCreditsModal, setShowCreditsModal] = useState(false);
	const queryClient = useQueryClient();

	const {
		messages: dbMessages,
		fetchNextPage,
		hasNextPage,
		isFetchingNextPage,
		isLoading: isHistoryLoading,
	} = useChatHistory(project?.id);

	const sendMessage = useSendChatMessage();

	const [input, setInput] = useState("");
	const messagesEndRef = useRef<HTMLDivElement>(null);
	const scrollContainerRef = useRef<HTMLDivElement>(null);
	const loadMoreTriggerRef = useRef<HTMLDivElement>(null);
	const projectTitleId = useId();

	// Intersection observer for load more
	useEffect(() => {
		if (!loadMoreTriggerRef.current || !hasNextPage) return;

		const observer = new IntersectionObserver(
			(entries) => {
				if (entries[0]?.isIntersecting) {
					fetchNextPage();
				}
			},
			{ threshold: 0.1 },
		);

		observer.observe(loadMoreTriggerRef.current);

		return () => observer.disconnect();
	}, [hasNextPage, fetchNextPage]);

	const historyMessages = useMemo(() => {
		return (dbMessages || []).map(
			(m) =>
				({
					id: m.id,
					role: m.role === "ai" ? "assistant" : "user",
					content: m.content,
					thinking: undefined,
					hasGraphUpdate: !!m.map_data,
					timestamp: new Date(m.created_at),
				}) as ChatMessage,
		);
	}, [dbMessages]);

	// Auto-scroll to bottom only on new messages or initial load
	useEffect(() => {
		if (historyMessages.length > 0 && !isFetchingNextPage) {
			// Only scroll if we are near the bottom to avoid disruptive scrolling when reading history
			if (scrollContainerRef.current) {
				const { scrollTop, scrollHeight, clientHeight } =
					scrollContainerRef.current;
				const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
				if (isNearBottom) {
					messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
				}
			}
		}
	}, [historyMessages.length, isFetchingNextPage]);

	const chatMutation = useMutation({
		mutationFn: async (message: string) => {
			if (!project?.id || !user?.id)
				throw new Error("Project or user not found");

			// 1. Add user message to DB
			await sendMessage.mutateAsync({
				mind_map_id: project.id,
				user_id: user.id,
				role: "user",
				content: message,
			});

			const chatHistory = historyMessages.map((m) => ({
				role: m.role as "user" | "assistant",
				content: m.content,
			}));

			// Check if this is the first message
			const isFirstMessage = chatHistory.length === 0;

			return await chatWithAIStreaming({
				data: {
					message,
					userId: user.id,
					projectContext: {
						title: projectTitle || "New Project",
						prompt: project?.first_prompt || "",
						nodes: nodes,
						edges: edges,
					},
					chatHistory,
					isFirstMessage,
				},
			});
		},
		onSuccess: async (data) => {
			if (!project?.id || !user?.id) return;

			// Refresh credits if action was generate or modify (credits were deducted)
			if (data.action === "generate" || data.action === "modify") {
				queryClient.invalidateQueries({ queryKey: ["userCredits", user.id] });
				queryClient.invalidateQueries({
					queryKey: ["creditTransactions", user.id],
				});
			}

			// 2. Add AI response to DB
			await sendMessage.mutateAsync({
				mind_map_id: project.id,
				user_id: user.id,
				role: "ai",
				content: data.message,
				map_data:
					(data.action === "generate" || data.action === "modify") &&
					data.graphData
						? data.graphData
						: null,
			});

			// Apply graph changes if any
			if (
				(data.action === "generate" || data.action === "modify") &&
				data.graphData &&
				onApplyChanges
			) {
				onApplyChanges(data.graphData.nodes, data.graphData.edges);
			}
		},
		onError: (error) => {
			console.error("Chat error:", error);
			// Show credits modal if insufficient credits
			const errorMessage =
				error instanceof Error
					? error.message
					: typeof error === "string"
						? error
						: String(error);
			if (errorMessage.includes("INSUFFICIENT_CREDITS")) {
				setShowCreditsModal(true);
			}
		},
	});

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!input.trim() || chatMutation.isPending) return;

		// Check if user has enough credits (1 credit per generation)
		if (!credits || credits.credits < 1) {
			setShowCreditsModal(true);
			return;
		}

		const msg = input.trim();
		setInput("");
		chatMutation.mutate(msg);
	};

	const displayMessages = useMemo(() => {
		const msgs = [...historyMessages];
		if (chatMutation.isPending && chatMutation.variables) {
			const pendingMsg: ChatMessage = {
				id: "pending-user",
				role: "user",
				content: chatMutation.variables,
				timestamp: new Date(),
			};
			// Prevent duplicate showing if DB update was super fast
			if (
				!msgs.some(
					(m) =>
						m.content === pendingMsg.content &&
						m.role === "user" &&
						m.timestamp.getTime() > Date.now() - 5000,
				)
			) {
				msgs.push(pendingMsg);
			}
		}
		return msgs;
	}, [historyMessages, chatMutation.isPending, chatMutation.variables]);

	const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
		if (e.key === "Enter" && !e.shiftKey) {
			e.preventDefault();
			handleSubmit(e);
		}
	};

	return (
		<>
			{/* Backdrop */}
			{isOpen && (
				<button
					type="button"
					className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 lg:hidden"
					onClick={onClose}
					onKeyDown={(e) => e.key === "Escape" && onClose()}
					aria-label="Close sidebar"
				/>
			)}

			{/* Sidebar */}
			<div
				className={`fixed right-0 top-0 h-full w-full sm:w-105 bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 shadow-xl z-50 transform transition-transform duration-300 ease-in-out flex flex-col ${
					isOpen ? "translate-x-0" : "translate-x-full"
				}`}
			>
				{/* Header */}
				<div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800">
					<div className="flex items-center gap-2">
						<div className="p-1.5 rounded-lg bg-indigo-100 dark:bg-indigo-950">
							<Bot className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
						</div>
						<div>
							<h2 className="font-semibold text-slate-900 dark:text-white">
								AI Assistant
							</h2>
							<p className="text-xs text-slate-500">
								Build your mind map with AI
							</p>
						</div>
					</div>
					<button
						type="button"
						onClick={onClose}
						className="p-2 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
					>
						<X className="w-5 h-5 text-slate-500" />
					</button>
				</div>

				{/* Project Title Input */}
				<div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
					<label
						htmlFor={projectTitleId}
						className="text-xs text-slate-500 mb-1 block"
					>
						Project Name
					</label>
					<input
						id={projectTitleId}
						type="text"
						value={projectTitle}
						onChange={(e) => setProjectTitle(e.target.value)}
						placeholder="Enter project name..."
						className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
					/>
				</div>

				{/* Messages */}
				<div
					ref={scrollContainerRef}
					className="flex-1 overflow-y-auto p-4 space-y-4"
				>
					{/* Load More Skeleton at Top */}
					{hasNextPage && (
						<div ref={loadMoreTriggerRef} className="flex justify-center py-2">
							{isFetchingNextPage && (
								<div className="space-y-2 w-full">
									<Skeleton className="h-12 w-3/4" />
									<Skeleton className="h-12 w-2/3 ml-auto" />
									<Skeleton className="h-12 w-3/4" />
								</div>
							)}
						</div>
					)}

					{isHistoryLoading && (
						<div className="space-y-4">
							<Skeleton className="h-12 w-3/4" />
							<Skeleton className="h-12 w-2/3 ml-auto" />
							<Skeleton className="h-12 w-3/4" />
						</div>
					)}

					{displayMessages.length === 0 && !isHistoryLoading && (
						<div className="text-center py-8">
							<Sparkles className="w-10 h-10 mx-auto text-indigo-400 mb-3" />
							<h3 className="font-medium text-slate-900 dark:text-white mb-1">
								Ready to build your mind map
							</h3>
							<p className="text-sm text-slate-500 mb-4">
								Describe your app idea and I'll create a detailed user flow map
								for you.
							</p>
							<div className="space-y-2">
								{[
									"Create a social media app like Twitter",
									"Build an e-commerce checkout flow",
									"Design a fitness tracking app",
								].map((suggestion) => (
									<button
										key={suggestion}
										type="button"
										onClick={() => setInput(suggestion)}
										className="w-full text-left text-sm px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors"
									>
										<ChevronRight className="w-3 h-3 inline mr-1" />
										{suggestion}
									</button>
								))}
							</div>
						</div>
					)}

					{displayMessages.map((message) => (
						<div
							key={message.id}
							className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
						>
							<div
								className={`max-w-[90%] ${
									message.role === "user"
										? "bg-indigo-600 text-white rounded-2xl px-4 py-2"
										: "space-y-2"
								}`}
							>
								{message.role === "assistant" && message.thinking && (
									<button
										type="button"
										className="flex items-center gap-2 text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors"
									>
										<Brain className="w-3 h-3" />
									</button>
								)}

								{/* Message Content */}
								<div
									className={
										message.role === "assistant"
											? "bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white rounded-2xl px-4 py-2"
											: ""
									}
								>
									<p className="text-sm whitespace-pre-wrap">
										{message.content}
									</p>
									{message.hasGraphUpdate && (
										<div className="flex items-center gap-1 mt-2 text-xs text-green-600 dark:text-green-400">
											<Zap className="w-3 h-3" />
											<span>Mind map updated</span>
										</div>
									)}
								</div>

								<p
									className={`text-xs mt-1 ${
										message.role === "user"
											? "text-indigo-200"
											: "text-slate-400 px-1"
									}`}
								>
									{formatTime(message.timestamp)}
								</p>
							</div>
						</div>
					))}

					{/* Thinking Indicator with Real-time Steps */}
					{chatMutation.isPending && (
						<div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4">
							<div className="flex items-center gap-2">
								<Brain className="w-4 h-4 text-indigo-500 animate-pulse" />
								<span className="text-sm font-medium text-slate-700 dark:text-slate-300">
									Thinking...
								</span>
							</div>
						</div>
					)}

					<div ref={messagesEndRef} />
				</div>

				{/* Input */}
				<div className="p-4 border-t border-slate-200 dark:border-slate-800">
					<form onSubmit={handleSubmit} className="relative">
						<AutoResizeTextarea
							value={input}
							onChange={(e) => setInput(e.target.value)}
							onKeyDown={handleKeyDown}
							placeholder="Describe your app idea or ask for changes..."
							rows={3}
							className="w-full resize-none rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-4 py-3 pr-12 text-sm text-slate-900 dark:text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
							disabled={chatMutation.isPending}
						/>
						<Button
							type="submit"
							size="icon"
							disabled={!input.trim() || chatMutation.isPending}
							className="absolute right-2 bottom-2"
						>
							{chatMutation.isPending ? (
								<Loader2 className="w-4 h-4 animate-spin" />
							) : (
								<Send className="w-4 h-4" />
							)}
						</Button>
					</form>
					<p className="text-xs text-slate-400 mt-2 text-center">
						Press Enter to send, Shift+Enter for new line
					</p>
				</div>
			</div>

			{/* Animation Keyframes */}
			<style>{`
				@keyframes fadeIn {
					from { opacity: 0; transform: translateX(-10px); }
					to { opacity: 1; transform: translateX(0); }
				}
			`}</style>

			{/* Insufficient Credits Modal */}
			<InsufficientCreditsModal
				open={showCreditsModal}
				onOpenChange={setShowCreditsModal}
				currentCredits={credits?.credits ?? 0}
			/>
		</>
	);
};
