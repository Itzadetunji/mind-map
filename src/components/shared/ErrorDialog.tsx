import { AlertCircle } from "lucide-react";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "../ui/dialog";
import { Button } from "../ui/button";

interface ErrorDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	title: string;
	description: string;
}

export function ErrorDialog({
	open,
	onOpenChange,
	title,
	description,
}: ErrorDialogProps) {
	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-md">
				<DialogHeader>
					<div className="flex items-center gap-3 mb-2">
						<div className="p-2 rounded-full bg-red-100 dark:bg-red-900/20">
							<AlertCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
						</div>
						<DialogTitle className="text-xl">{title}</DialogTitle>
					</div>
					<DialogDescription className="text-base pt-2">
						{description}
					</DialogDescription>
				</DialogHeader>

				<DialogFooter>
					<Button onClick={() => onOpenChange(false)}>OK</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
