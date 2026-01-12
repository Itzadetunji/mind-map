import { useMutation } from "@tanstack/react-query";
import type { Edge, Node } from "@xyflow/react";
import {
	Bot,
	Brain,
	CheckCircle2,
	ChevronRight,
	Circle,
	Loader2,
	Send,
	Sparkles,
	X,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import type { MindMapProject } from "@/lib/database.types";
import { chatWithAI } from "@/server/streaming-mind-map";

interface ChatMessage {
	id: string;
	role: "user" | "assistant";
	content: string;
	thinkingSteps?: ThinkingStep[];
	timestamp: Date;
}

interface ThinkingStep {
	step: string;
	status: "pending" | "active" | "completed";
	content?: string;
}

interface AIChatSidebarProps {
	isOpen: boolean;
	onClose: () => void;
	project: MindMapProject | null;
	nodes: Node[];
	edges: Edge[];
	onApplyChanges?: (nodes: Node[], edges: Edge[]) => void;
}

const THINKING_STEPS: ThinkingStep[] = [
	{ step: "Understanding your request", status: "pending" },
	{ step: "Analyzing current mind map", status: "pending" },
	{ step: "Gathering context & references", status: "pending" },
	{ step: "Evaluating options", status: "pending" },
	{ step: "Generating response", status: "pending" },
];

export function AIChatSidebar({
	isOpen,
	onClose,
	project,
	nodes,
	edges,
}: AIChatSidebarProps) {
	const [messages, setMessages] = useState<ChatMessage[]>([]);
	const [input, setInput] = useState("");
	const [thinkingSteps, setThinkingSteps] = useState<ThinkingStep[]>([]);
	const [isThinking, setIsThinking] = useState(false);
	const messagesEndRef = useRef<HTMLDivElement>(null);
	const inputRef = useRef<HTMLTextAreaElement>(null);

	const scrollToBottom = useCallback(() => {
		messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
	}, []);

	useEffect(() => {
		scrollToBottom();
	}, [scrollToBottom]);

	const simulateThinking = useCallback(async () => {
		setIsThinking(true);
		const steps = [...THINKING_STEPS];

		for (let i = 0; i < steps.length; i++) {
			// Mark previous as completed
			if (i > 0) {
				steps[i - 1].status = "completed";
			}
			// Mark current as active
			steps[i].status = "active";
			setThinkingSteps([...steps]);

			// Wait before moving to next step (except last one)
			if (i < steps.length - 1) {
				await new Promise((r) => setTimeout(r, 400 + Math.random() * 300));
			}
		}
	}, []);

	const chatMutation = useMutation({
		mutationFn: async (message: string) => {
			const chatHistory = messages.map((m) => ({
				role: m.role,
				content: m.content,
			}));

			return await chatWithAI({
				data: {
					message,
					projectContext: project
						? {
								title: project.title,
								prompt: project.prompt,
								nodes: nodes,
								edges: edges,
							}
						: undefined,
					chatHistory,
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

				const assistantMessage: ChatMessage = {
					id: Date.now().toString(),
					role: "assistant",
					content: data.content,
					timestamp: new Date(),
				};
				setMessages((prev) => [...prev, assistantMessage]);
			}, 300);
		},
		onError: (error) => {
			setIsThinking(false);
			setThinkingSteps([]);
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

		// Start thinking animation
		await simulateThinking();

		// Then make the actual request
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
				className={`fixed right-0 top-0 h-full w-full sm:w-96 bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 shadow-xl z-50 transform transition-transform duration-300 ease-in-out flex flex-col ${
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
								Ask questions or request changes
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

				{/* Messages */}
				<div className="flex-1 overflow-y-auto p-4 space-y-4">
					{messages.length === 0 && !isThinking && (
						<div className="text-center py-8">
							<Sparkles className="w-10 h-10 mx-auto text-indigo-400 mb-3" />
							<h3 className="font-medium text-slate-900 dark:text-white mb-1">
								How can I help?
							</h3>
							<p className="text-sm text-slate-500 mb-4">
								Ask me to refine your mind map, add features, or explain design
								patterns.
							</p>
							<div className="space-y-2">
								{[
									"Add error handling screens",
									"Suggest improvements for auth flow",
									"What patterns work for onboarding?",
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
								className={`max-w-[85%] rounded-2xl px-4 py-2 ${
									message.role === "user"
										? "bg-indigo-600 text-white"
										: "bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white"
								}`}
							>
								<p className="text-sm whitespace-pre-wrap">{message.content}</p>
								<p
									className={`text-xs mt-1 ${
										message.role === "user"
											? "text-indigo-200"
											: "text-slate-400"
									}`}
								>
									{message.timestamp.toLocaleTimeString([], {
										hour: "2-digit",
										minute: "2-digit",
									})}
								</p>
							</div>
						</div>
					))}

					{/* Thinking Steps */}
					{isThinking && thinkingSteps.length > 0 && (
						<div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4">
							<div className="flex items-center gap-2 mb-3">
								<Brain className="w-4 h-4 text-indigo-500 animate-pulse" />
								<span className="text-sm font-medium text-slate-700 dark:text-slate-300">
									Thinking...
								</span>
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
											<CheckCircle2 className="w-4 h-4" />
										) : step.status === "active" ? (
											<Loader2 className="w-4 h-4 animate-spin" />
										) : (
											<Circle className="w-4 h-4" />
										)}
										<span
											className={step.status === "active" ? "font-medium" : ""}
										>
											{step.step}
										</span>
									</div>
								))}
							</div>
						</div>
					)}

					<div ref={messagesEndRef} />
				</div>

				{/* Input */}
				<div className="p-4 border-t border-slate-200 dark:border-slate-800">
					<form onSubmit={handleSubmit} className="relative">
						<textarea
							ref={inputRef}
							value={input}
							onChange={(e) => setInput(e.target.value)}
							onKeyDown={handleKeyDown}
							placeholder="Ask about your mind map..."
							rows={2}
							className="w-full resize-none rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-4 py-3 pr-12 text-sm text-slate-900 dark:text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
							disabled={chatMutation.isPending}
						/>
						<button
							type="submit"
							disabled={!input.trim() || chatMutation.isPending}
							className="absolute right-2 bottom-2 p-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
						>
							{chatMutation.isPending ? (
								<Loader2 className="w-4 h-4 animate-spin" />
							) : (
								<Send className="w-4 h-4" />
							)}
						</button>
					</form>
					<p className="text-xs text-slate-400 mt-2 text-center">
						Press Enter to send, Shift+Enter for new line
					</p>
				</div>
			</div>
		</>
	);
}
