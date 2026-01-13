import { useMutation } from "@tanstack/react-query";
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
import { useCallback, useEffect, useId, useRef, useState } from "react";
import type { MindMapProject } from "@/lib/database.types";
import { formatTime } from "@/lib/date-utils";
import { chatWithAIStreaming } from "@/server/streaming-mind-map";
import { useProjectStore } from "@/stores/projectStore";
import { AutoResizeTextarea } from "./shared/AutoResizeTextArea";
import { Button } from "./ui/button";

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

export function AIChatSidebar({
	isOpen,
	onClose,
	project,
	nodes,
	edges,
	onApplyChanges,
}: AIChatSidebarProps) {
	const { projectTitle, setProjectTitle } = useProjectStore();
	const [messages, setMessages] = useState<ChatMessage[]>([]);
	const [input, setInput] = useState("");
	const messagesEndRef = useRef<HTMLDivElement>(null);
	const projectTitleId = useId();

	const scrollToBottom = useCallback(() => {
		messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
	}, []);

	// biome-ignore lint/correctness/useExhaustiveDependencies: intentionally scroll on message/step changes
	useEffect(() => {
		scrollToBottom();
	}, [scrollToBottom, messages]);

	const chatMutation = useMutation({
		mutationFn: async (message: string) => {
			const chatHistory = messages.map((m) => ({
				role: m.role,
				content: m.content,
			}));

			// Check if this is the first message
			const isFirstMessage = chatHistory.length === 0;

			return await chatWithAIStreaming({
				data: {
					message,
					projectContext: {
						title: projectTitle || "New Project",
						prompt: project?.prompt || "",
						nodes: nodes,
						edges: edges,
					},
					chatHistory,
					isFirstMessage,
				},
			});
		},
		onSuccess: (data) => {
			// Create assistant message with real thinking
			const assistantMessage: ChatMessage = {
				id: Date.now().toString(),
				role: "assistant",
				content: data.message,
				thinking: data.thinking,
				hasGraphUpdate: data.action !== "none" && data.graphData !== null,
				timestamp: new Date(),
			};
			setMessages((prev) => [...prev, assistantMessage]);

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

			const errorMessage: ChatMessage = {
				id: Date.now().toString(),
				role: "assistant",
				content:
					"Sorry, I encountered an error processing your request. Please try again.",
				timestamp: new Date(),
			};
			setMessages((prev) => [...prev, errorMessage]);
		},
	});

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!input.trim() || chatMutation.isPending) return;

		const userMessage: ChatMessage = {
			id: Date.now().toString(),
			role: "user",
			content: input.trim(),
			timestamp: new Date(),
		};

		setMessages((prev) => [...prev, userMessage]);
		setInput("");

		// Make the request
		chatMutation.mutate(userMessage.content);
	};

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
				<div className="flex-1 overflow-y-auto p-4 space-y-4">
					{messages.length === 0 && (
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

					{messages.map((message) => (
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
		</>
	);
}
