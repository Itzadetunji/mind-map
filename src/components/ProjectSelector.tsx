import { Link } from "@tanstack/react-router";
import { Clock, FileText, Loader2, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import {
	useDeleteMindMapProject,
	useMindMapProjects,
} from "@/hooks/mind-maps.hooks";
import type { MindMapProject } from "@/lib/database.types";
import { formatRelativeDate } from "@/lib/date-utils";
import { ConfirmDialog } from "./shared/ConfirmDialog";
import { Button } from "./ui/button";

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
	const { data: projects, isLoading } = useMindMapProjects();
	const deleteMutation = useDeleteMindMapProject();
	const [showDeleteDialog, setShowDeleteDialog] = useState(false);
	const [projectToDelete, setProjectToDelete] = useState<string | null>(null);

	return (
		<section className="flex-1 bg-slate-50 dark:bg-slate-950 p-4 sm:p-6 lg:p-8 flex flex-col">
			<div className="max-w-4xl mx-auto flex-1 w-full">
				<div className="flex items-center justify-between mb-8">
					<div>
						<h1 className="text-2xl font-bold text-slate-900 dark:text-white">
							Your Projects
						</h1>
						<p className="text-slate-600 dark:text-slate-400 mt-1">
							Select a project to continue or create a new one
						</p>
					</div>
					<Button
						onClick={onNewProject}
						disabled={isCreating}
						className="bg-[#03045E] hover:bg-[#023E8A] text-white dark:bg-[#0077B6] dark:hover:bg-[#0096C7]"
					>
						{isCreating ? (
							<Loader2 className="w-4 h-4 animate-spin" />
						) : (
							<Plus className="w-4 h-4" />
						)}
						{isCreating ? "Creating..." : "New Project"}
					</Button>
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
								className="group relative bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 hover:border-[#03045E]/30 dark:hover:border-[#0077B6]/50 hover:shadow-lg transition-all cursor-pointer text-left w-full"
								onClick={() => onSelectProject(project)}
							>
								<div className="flex items-start justify-between mb-3">
									<div className="p-2 rounded-lg bg-[#03045E]/10 dark:bg-[#0077B6]/20">
										<img
											src="/assets/brand/logo-transparent.png"
											alt="logo"
											className="size-5"
										/>
									</div>
									<Button
										variant="ghost"
										size="icon-sm"
										onClick={(e) => {
											e.stopPropagation();
											setProjectToDelete(project.id);
											setShowDeleteDialog(true);
										}}
										className="opacity-0 group-hover:opacity-100 hover:bg-red-50 dark:hover:bg-red-950 text-slate-400 hover:text-red-500"
									>
										<Trash2 className="w-4 h-4" />
									</Button>
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
										{formatRelativeDate(project.updated_at)}
									</span>
								</div>
							</button>
						))}
					</div>
				) : (
					<div className="text-center py-20 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col items-center gap-4">
						<img
							src="/assets/brand/logo-transparent.png"
							alt="logo"
							className="size-12"
						/>
						<div className="flex flex-col items-center gap-4">
							<h3 className="text-lg font-medium text-slate-900 dark:text-white">
								No mind maps yet
							</h3>
							<p className="text-slate-600 dark:text-slate-400">
								Create your first mind map to get started
							</p>
						</div>
						<Button
							onClick={onNewProject}
							className="bg-[#03045E] hover:bg-[#023E8A] text-white dark:bg-[#0077B6] dark:hover:bg-[#0096C7]"
						>
							<Plus className="w-4 h-4" />
							Create Mind Map
						</Button>
					</div>
				)}

				{/* Delete Confirmation Dialog */}
				<ConfirmDialog
					open={showDeleteDialog}
					onOpenChange={setShowDeleteDialog}
					title="Delete Project"
					description="Are you sure you want to delete this project? This action cannot be undone."
					confirmLabel="Delete"
					cancelLabel="Cancel"
					variant="destructive"
					onConfirm={() => {
						if (projectToDelete) {
							deleteMutation.mutate(projectToDelete);
							setProjectToDelete(null);
						}
					}}
				/>
			</div>
			{/* Footer Links */}
			<footer className="mt-16 pt-8 border-t border-slate-200 dark:border-slate-800">
				<div className="flex flex-wrap items-center justify-center gap-6 text-sm text-slate-600 dark:text-slate-400">
					<Link
						to="/privacy"
						className="hover:text-[#03045E] dark:hover:text-[#0077B6] transition-colors"
					>
						Privacy Policy
					</Link>
					<span className="text-slate-400 dark:text-slate-600">•</span>
					<Link
						to="/terms"
						className="hover:text-[#03045E] dark:hover:text-[#0077B6] transition-colors"
					>
						Terms and Conditions
					</Link>
				</div>
			</footer>
		</section>
	);
}
