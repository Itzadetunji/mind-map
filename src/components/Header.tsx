import { Link } from "@tanstack/react-router";
import { MessageSquare, Network } from "lucide-react";
import { AuthButton } from "./AuthButton";
import { Button } from "./ui/button";

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
		<header className="sticky top-0 p-4 flex items-center justify-between bg-white text-black border-b border-gray-200 z-10 dark:bg-black dark:text-white dark:border-gray-800">
			<div className="flex items-center gap-4">
				<div className="flex items-center gap-2">
					<img
						src="/assets/brand/logo-white.png"
						alt="Proto Map"
						className="w-8 h-8"
					/>
					<h1 className="text-xl font-semibold">
						<Link to="/projects">Proto Map</Link>
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
					<Button
						variant="link"
						onClick={onBackToProjects}
						className="text-sm text-[#03045E] dark:text-[#0077B6]"
					>
						← All Projects
					</Button>
				)}
			</div>
			<div className="flex items-center gap-3">
				{showChatButton && onChatToggle && (
					<Button
						variant="outline"
						onClick={onChatToggle}
						className="flex items-center gap-2 bg-[#03045E]/10 dark:bg-[#0077B6]/20 text-[#03045E] dark:text-[#0077B6] hover:bg-[#03045E]/20 dark:hover:bg-[#0077B6]/30 border-[#03045E]/20 dark:border-[#0077B6]/30"
					>
						<MessageSquare className="w-4 h-4" />
						<span className="hidden sm:inline">AI Chat</span>
					</Button>
				)}
				<AuthButton />
			</div>
		</header>
	);
}
