import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { SubscriptionPricingMeta, subscriptionPlans } from "@/lib/constants";

interface ChangePlanModalProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	/** Target tier: "hobby" | "pro" */
	targetTierId: string | null;
	/** "upgrade" | "downgrade" */
	action: "upgrade" | "downgrade" | null;
	onConfirm: (tierId: string) => void;
	isLoading?: boolean;
}

export const ChangePlanModal = ({
	open,
	onOpenChange,
	targetTierId,
	action,
	onConfirm,
	isLoading = false,
}: ChangePlanModalProps) => {
	const plan = targetTierId
		? subscriptionPlans.find((p) => p.id === targetTierId)
		: null;
	const meta = plan ? SubscriptionPricingMeta[plan.id] : null;

	const handleConfirm = () => {
		if (targetTierId) {
			onConfirm(targetTierId);
			onOpenChange(false);
		}
	};

	const handleOpenChange = (next: boolean) => {
		if (!isLoading) onOpenChange(next);
	};

	if (!plan || !meta || !action) return null;

	const isUpgrade = action === "upgrade";

	return (
		<Dialog open={open} onOpenChange={handleOpenChange}>
			<DialogContent className="sm:max-w-md">
				<DialogHeader>
					<DialogTitle>
						{isUpgrade ? "Upgrade" : "Downgrade"} to {plan.name}
					</DialogTitle>
					<DialogDescription className="flex flex-col gap-2">
						{isUpgrade ? (
							<>
								<p>
									You'll get access to more credits and features. Your billing
									will be prorated for the remainder of your current period.
								</p>
								<p className="font-medium text-foreground">
									${plan.price}/month · {meta.description}
								</p>
							</>
						) : (
							<>
								<p>
									Your plan will change to {plan.name} at the end of your
									current billing period. You'll keep your current plan benefits
									until then.
								</p>
								<p className="font-medium text-foreground">
									${plan.price}/month · {meta.description}
								</p>
							</>
						)}
					</DialogDescription>
				</DialogHeader>
				<DialogFooter className="gap-2 sm:gap-4">
					<Button
						variant="outline"
						onClick={() => onOpenChange(false)}
						disabled={isLoading}
					>
						Cancel
					</Button>
					<Button
						onClick={handleConfirm}
						disabled={isLoading}
						className={plan.id === "pro" ? "bg-primary text-white hover:bg-primary/90" : ""}
					>
						{isLoading ? (
							<>
								<Loader2 className="mr-2 h-4 w-4 animate-spin" />
								Processing…
							</>
						) : isUpgrade ? (
							`Upgrade to ${plan.name}`
						) : (
							`Switch to ${plan.name}`
						)}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
};
