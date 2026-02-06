import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";

interface SubscriptionFailedModalProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
}

export function SubscriptionFailedModal({
	open,
	onOpenChange,
}: SubscriptionFailedModalProps) {
	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-md">
				<DialogHeader>
					<DialogTitle className="text-xl">Subscription failed</DialogTitle>

					<DialogDescription className="text-base pt-2">
						We couldn’t activate your subscription. Please try again or use a
						different payment method.
					</DialogDescription>
				</DialogHeader>

				<DialogFooter>
					<Button onClick={() => onOpenChange(false)}>Got it</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
