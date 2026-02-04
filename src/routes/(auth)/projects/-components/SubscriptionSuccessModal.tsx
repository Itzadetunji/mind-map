import { CheckCircle2 } from "lucide-react";
import { useRef } from "react";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import {
	SubscriptionIconMap,
	SubscriptionPricingMeta,
	subscriptionPlans,
} from "@/lib/constants";
import type { SubscriptionTierType } from "@/lib/database.types";

interface SubscriptionSuccessModalProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	subscriptionTier?: SubscriptionTierType | null;
}

export function SubscriptionSuccessModal({
	open,
	onOpenChange,
	subscriptionTier,
}: SubscriptionSuccessModalProps) {
	const subscriptionTierRef = useRef(subscriptionTier);

	const plan = subscriptionPlans.find(
		(item) => item.id === subscriptionTierRef.current,
	);
	const meta = subscriptionTierRef.current
		? SubscriptionPricingMeta[
				subscriptionTierRef.current as Exclude<SubscriptionTierType, "free">
			]
		: null;
	const Icon = plan ? SubscriptionIconMap[plan.icon] : null;

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-md">
				<DialogHeader>
					<div className="flex items-center gap-3 mb-2">
						<div className="p-2 rounded-full bg-primary/10 dark:bg-[#0077B6]/20">
							<CheckCircle2 className="w-6 h-6 text-primary dark:text-[#0077B6]" />
						</div>
						<DialogTitle className="text-xl">Subscription active</DialogTitle>
					</div>
					<DialogDescription className="text-base pt-2">
						{plan
							? `You're now on the ${plan.name} plan.`
							: "Your subscription is now active."}
					</DialogDescription>
				</DialogHeader>

				{plan && (
					<div className="rounded-lg border bg-slate-50 dark:bg-slate-900/40 p-4 flex items-center gap-3">
						{Icon && <Icon className="w-5 h-5 text-primary" />}
						<div>
							<p className="font-semibold text-slate-900 dark:text-slate-100">
								{plan.name}
							</p>
							{meta?.description && (
								<p className="text-sm text-slate-500 dark:text-slate-400">
									{meta.description}
								</p>
							)}
						</div>
					</div>
				)}

				<DialogFooter>
					<Button onClick={() => onOpenChange(false)}>Got it</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
