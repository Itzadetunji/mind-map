import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";

import {
	mindMapsQueryKeys,
	useUpdateMindMapProject,
} from "@/api/http/v1/mind-maps/mind-maps.hooks";
import type { MindMapProject } from "@/lib/database.types";
import { AutoResizeTextarea } from "./shared/AutoResizeTextArea";
import { Button } from "./ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "./ui/dialog";

interface EditInitialIdeaDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	project: MindMapProject | null;
}

export function EditInitialIdeaDialog({
	open,
	onOpenChange,
	project,
}: EditInitialIdeaDialogProps) {
	const [value, setValue] = useState("");
	const queryClient = useQueryClient();
	const updateProjectMutation = useUpdateMindMapProject();

	useEffect(() => {
		if (open && project?.first_prompt != null) {
			setValue(project.first_prompt);
		}
	}, [open, project?.first_prompt]);

	const handleSave = () => {
		if (!project?.id) return;
		updateProjectMutation.mutate(
			{ id: project.id, first_prompt: value.trim() },
			{
				onSuccess: () => {
					queryClient.invalidateQueries({
						queryKey: mindMapsQueryKeys.detail(project.id),
					});
					onOpenChange(false);
				},
			},
		);
	};

	const isUnchanged = value.trim() === (project?.first_prompt ?? "");
	const isDisabled =
		!value.trim() || updateProjectMutation.isPending || isUnchanged;

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="flex max-h-[90vh] flex-col overflow-hidden sm:max-w-md">
				<DialogHeader>
					<DialogTitle>Edit initial idea</DialogTitle>
					<DialogDescription>
						Update the goal or idea for this mind map. The AI uses this as
						long-term context.
					</DialogDescription>
				</DialogHeader>
				<div className="min-h-100 flex-1 overflow-y-auto flex flex-col">
					<textarea
						value={value}
						onChange={(e) => setValue(e.target.value)}
						placeholder="Describe your project or idea..."
						rows={4}
						className="min-h-24 flex-1 w-full resize-y rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/50 outline-none ring-0!"
					/>
				</div>
				<DialogFooter>
					<Button variant="outline" onClick={() => onOpenChange(false)}>
						Cancel
					</Button>
					<Button onClick={handleSave} disabled={isDisabled}>
						{updateProjectMutation.isPending ? "Saving…" : "Save"}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
