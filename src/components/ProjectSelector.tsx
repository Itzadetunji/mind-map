import { Clock, FileText, Loader2, Network, Plus, Trash2 } from "lucide-react";
import {
	useDeleteMindMapProject,
	useMindMapProjects,
} from "@/hooks/useMindMapProjects";
import type { MindMapProject } from "@/lib/database.types";
import { useAuthStore } from "@/stores/authStore";

interface ProjectSelectorProps {
	onSelectProject: (project: MindMapProject) => void;
	onNewProject: () => void;
	isCreating?: boolean;
}

export function ProjectSelector({
	onSelectProject,
	onNewProject,
	isCreating = false,
}: ProjectSelectorProps) {
	const { user, loading: authLoading, signInWithGoogle } = useAuthStore();
	const { data: projects, isLoading } = useMindMapProjects();
	const deleteMutation = useDeleteMindMapProject();

	if (authLoading) {
		return (
			<div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
				<Loader2 className="w-8 h-8 animate-spin text-slate-400" />
			</div>
		);
	}

	if (!user) {
		return (
			<div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950 p-4">
				<div className="max-w-md w-full text-center">
					<div className="mb-8">
						<Network className="w-16 h-16 mx-auto text-indigo-500 mb-4" />
						<h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
							Mind Mapper
						</h1>
						<p className="text-slate-600 dark:text-slate-400">
							Transform your app ideas into visual user flow diagrams with AI
						</p>
					</div>

					<button
						type="button"
						onClick={signInWithGoogle}
						className="flex items-center justify-center gap-3 w-full px-6 py-3 text-base font-medium rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
					>
						<svg
							className="w-5 h-5"
							viewBox="0 0 24 24"
							role="img"
							aria-label="Google"
						>
							<path
								fill="#4285F4"
								d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
							/>
							<path
								fill="#34A853"
								d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
							/>
							<path
								fill="#FBBC05"
								d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
							/>
							<path
								fill="#EA4335"
								d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
							/>
						</svg>
						Continue with Google
					</button>

					<p className="mt-6 text-sm text-slate-500 dark:text-slate-500">
						Sign in to save and manage your mind maps
					</p>
				</div>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-4 sm:p-6 lg:p-8">
			<div className="max-w-4xl mx-auto">
				<div className="flex items-center justify-between mb-8">
					<div>
						<h1 className="text-2xl font-bold text-slate-900 dark:text-white">
							Your Mind Maps
						</h1>
						<p className="text-slate-600 dark:text-slate-400 mt-1">
							Select a project to continue or create a new one
						</p>
					</div>
					<button
						type="button"
						onClick={onNewProject}
						disabled={isCreating}
						className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
					>
						{isCreating ? (
							<Loader2 className="w-4 h-4 animate-spin" />
						) : (
							<Plus className="w-4 h-4" />
						)}
						{isCreating ? "Creating..." : "New Mind Map"}
					</button>
				</div>

				{isLoading ? (
					<div className="flex items-center justify-center py-20">
						<Loader2 className="w-8 h-8 animate-spin text-slate-400" />
					</div>
				) : projects && projects.length > 0 ? (
					<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
						{projects.map((project) => (
							<button
								type="button"
								key={project.id}
								className="group relative bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 hover:border-indigo-300 dark:hover:border-indigo-700 hover:shadow-lg transition-all cursor-pointer text-left w-full"
								onClick={() => onSelectProject(project)}
							>
								<div className="flex items-start justify-between mb-3">
									<div className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-950">
										<Network className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
									</div>
									<button
										type="button"
										onClick={(e) => {
											e.stopPropagation();
											if (
												confirm("Are you sure you want to delete this project?")
											) {
												deleteMutation.mutate(project.id);
											}
										}}
										className="opacity-0 group-hover:opacity-100 p-1.5 rounded-md hover:bg-red-50 dark:hover:bg-red-950 text-slate-400 hover:text-red-500 transition-all"
									>
										<Trash2 className="w-4 h-4" />
									</button>
								</div>

								<h3 className="font-semibold text-slate-900 dark:text-white mb-1 line-clamp-1">
									{project.title}
								</h3>

								{project.description && (
									<p className="text-sm text-slate-600 dark:text-slate-400 mb-3 line-clamp-2">
										{project.description}
									</p>
								)}

								<div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-500">
									<span className="flex items-center gap-1">
										<FileText className="w-3 h-3" />
										{project.graph_data.nodes?.length || 0} nodes
									</span>
									<span className="flex items-center gap-1">
										<Clock className="w-3 h-3" />
										{formatDate(project.updated_at)}
									</span>
								</div>
							</button>
						))}
					</div>
				) : (
					<div className="text-center py-20 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
						<Network className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-700 mb-4" />
						<h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">
							No mind maps yet
						</h3>
						<p className="text-slate-600 dark:text-slate-400 mb-6">
							Create your first mind map to get started
						</p>
						<button
							type="button"
							onClick={onNewProject}
							className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition-colors"
						>
							<Plus className="w-4 h-4" />
							Create Mind Map
						</button>
					</div>
				)}
			</div>
		</div>
	);
}

function formatDate(dateString: string): string {
	const date = new Date(dateString);
	const now = new Date();
	const diffMs = now.getTime() - date.getTime();
	const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

	if (diffDays === 0) {
		const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
		if (diffHours === 0) {
			const diffMins = Math.floor(diffMs / (1000 * 60));
			return diffMins <= 1 ? "Just now" : `${diffMins}m ago`;
		}
		return `${diffHours}h ago`;
	}
	if (diffDays === 1) return "Yesterday";
	if (diffDays < 7) return `${diffDays}d ago`;
	return date.toLocaleDateString();
}
