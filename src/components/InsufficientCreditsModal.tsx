import { Link } from "@tanstack/react-router";
import { AlertCircle, Zap } from "lucide-react";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "./ui/dialog";
import { Button } from "./ui/button";

interface InsufficientCreditsModalProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	currentCredits: number;
}

export function InsufficientCreditsModal({
	open,
	onOpenChange,
	currentCredits,
}: InsufficientCreditsModalProps) {
	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-md">
				<DialogHeader>
					<div className="flex items-center gap-3 mb-2">
						<div className="p-2 rounded-full bg-orange-100 dark:bg-orange-900/30">
							<AlertCircle className="w-6 h-6 text-orange-600 dark:text-orange-400" />
						</div>
						<DialogTitle className="text-xl">
							Insufficient Credits
						</DialogTitle>
					</div>
					<DialogDescription className="text-base pt-2">
						You don't have enough credits to generate a mind map. Each AI
						generation uses <strong>1 credit</strong>.
					</DialogDescription>
				</DialogHeader>

				<div className="py-4">
					<div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
						<div className="flex items-center gap-2">
							<Zap className="w-5 h-5 text-indigo-500" />
							<span className="text-sm font-medium text-slate-700 dark:text-slate-300">
								Current Credits
							</span>
						</div>
						<span className="text-2xl font-bold text-slate-900 dark:text-slate-100">
							{currentCredits}
						</span>
					</div>
					<p className="text-sm text-slate-500 mt-4 text-center">
						Purchase more credits or upgrade your subscription to continue
						creating mind maps.
					</p>
				</div>

				<DialogFooter className="flex-col sm:flex-row gap-2">
					<Button
						variant="outline"
						onClick={() => onOpenChange(false)}
						className="w-full sm:w-auto"
					>
						Cancel
					</Button>
					<Link to="/account" className="w-full sm:w-auto">
						<Button
							className="w-full sm:w-auto"
							onClick={() => onOpenChange(false)}
						>
							Get Credits
						</Button>
					</Link>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
