import { Link } from "@tanstack/react-router";
import { MessageSquare, Network } from "lucide-react";
import { AuthButton } from "./AuthButton";

interface HeaderProps {
	showChatButton?: boolean;
	onChatToggle?: () => void;
	projectTitle?: string;
	onBackToProjects?: () => void;
}

export function Header({
	showChatButton = false,
	onChatToggle,
	projectTitle,
	onBackToProjects,
}: HeaderProps) {
	return (
		<header className="p-4 flex items-center justify-between bg-white text-black border-b border-gray-200 z-10 relative dark:bg-black dark:text-white dark:border-gray-800">
			<div className="flex items-center gap-4">
				<div className="flex items-center gap-2">
					<Network className="w-8 h-8 text-black dark:text-white" />
					<h1 className="text-xl font-semibold">
						<Link to="/">Mind Mapper</Link>
					</h1>
				</div>
				{projectTitle && (
					<>
						<span className="text-slate-300 dark:text-slate-600">/</span>
						<span className="text-slate-600 dark:text-slate-400 truncate max-w-50">
							{projectTitle}
						</span>
					</>
				)}
				{onBackToProjects && (
					<button
						type="button"
						onClick={onBackToProjects}
						className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline"
					>
						← All Projects
					</button>
				)}
			</div>
			<div className="flex items-center gap-3">
				{showChatButton && onChatToggle && (
					<button
						type="button"
						onClick={onChatToggle}
						className="flex items-center gap-2 px-3 py-2 text-sm rounded-lg bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900 transition-colors"
					>
						<MessageSquare className="w-4 h-4" />
						<span className="hidden sm:inline">AI Chat</span>
					</button>
				)}
				<AuthButton />
			</div>
		</header>
	);
}
