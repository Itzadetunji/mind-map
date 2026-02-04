import { AlertCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useCancelDodoSubscription } from "@/api/http/v1/credits/credits.hooks";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";

interface CancelSubscriptionModalProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	subscriptionId: string | null;
}

export const CancelSubscriptionModal = ({
	open,
	onOpenChange,
	subscriptionId,
}: CancelSubscriptionModalProps) => {
	const cancelMutation = useCancelDodoSubscription();

	const handleCancelSubscription = async () => {
		if (!subscriptionId) {
			toast.error("No active subscription found.");
			return;
		}
		try {
			await cancelMutation.mutateAsync({ subscriptionId });
			toast.success("Subscription cancelled", {
				description:
					"Your subscription will end at the end of the current billing period. You'll keep access until then.",
			});
			onOpenChange(false);
		} catch (error) {
			const message =
				error instanceof Error
					? error.message
					: "Failed to cancel subscription";
			toast.error("Could not cancel subscription", { description: message });
		}
	};

	const handleOpenChange = (next: boolean) => {
		if (!cancelMutation.isPending) onOpenChange(next);
	};

	return (
		<Dialog open={open} onOpenChange={handleOpenChange}>
			<DialogContent className="sm:max-w-md">
				<DialogHeader>
					<DialogTitle>Cancel subscription</DialogTitle>
					<DialogDescription className="flex flex-col gap-1">
						<p>We're sorry to see you go.</p>
						<p>
							Your plan will remain active until the end of the current billing
							period. You won't be charged again, and you'll retain access to
							your credits until then.
						</p>
					</DialogDescription>
				</DialogHeader>
				<DialogFooter className="gap-2 sm:gap-4 ">
					<Button
						variant="outline"
						onClick={() => onOpenChange(false)}
						disabled={cancelMutation.isPending}
					>
						Keep subscription
					</Button>
					<Button
						variant="destructive"
						onClick={handleCancelSubscription}
						disabled={cancelMutation.isPending || !subscriptionId}
					>
						{cancelMutation.isPending ? (
							<>
								<Loader2 className="mr-2 h-4 w-4 animate-spin" />
								Cancelling 😭
							</>
						) : (
							"Cancel Now"
						)}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
};
