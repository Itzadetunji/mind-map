import { AlertTriangle } from "lucide-react";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "../ui/dialog";
import { Button } from "../ui/button";

interface ConfirmDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	title: string;
	description: string;
	confirmLabel?: string;
	cancelLabel?: string;
	onConfirm: () => void;
	variant?: "default" | "destructive";
}

export function ConfirmDialog({
	open,
	onOpenChange,
	title,
	description,
	confirmLabel = "Confirm",
	cancelLabel = "Cancel",
	onConfirm,
	variant = "default",
}: ConfirmDialogProps) {
	const handleConfirm = () => {
		onConfirm();
		onOpenChange(false);
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-md">
				<DialogHeader>
					<div className="flex items-center gap-3 mb-2">
						<div
							className={`p-2 rounded-full ${
								variant === "destructive"
									? "bg-red-100 dark:bg-red-900/20"
									: "bg-[#03045E]/10 dark:bg-[#0077B6]/20"
							}`}
						>
							<AlertTriangle
								className={`w-6 h-6 ${
									variant === "destructive"
										? "text-red-600 dark:text-red-400"
										: "text-[#03045E] dark:text-[#0077B6]"
								}`}
							/>
						</div>
						<DialogTitle className="text-xl">{title}</DialogTitle>
					</div>
					<DialogDescription className="text-base pt-2">
						{description}
					</DialogDescription>
				</DialogHeader>

				<DialogFooter className="flex-col sm:flex-row gap-2">
					<Button
						variant="outline"
						onClick={() => onOpenChange(false)}
						className="w-full sm:w-auto"
					>
						{cancelLabel}
					</Button>
					<Button
						onClick={handleConfirm}
						variant={variant === "destructive" ? "destructive" : "default"}
						className="w-full sm:w-auto"
					>
						{confirmLabel}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
