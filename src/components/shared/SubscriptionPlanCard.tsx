import { Link } from "@tanstack/react-router";
import { Check } from "lucide-react";
import React from "react";

import { ChangePlanModal } from "@/components/shared/ChangePlanModal";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import {
	SubscriptionIconMap,
	SubscriptionPricingMeta,
	subscriptionPlans,
} from "@/lib/constants";

interface SubscriptionPlanCardProps {
	mode: "landing" | "account";
	isCurrent?: (tierId: string) => boolean;
	isLoading?: boolean;
	isCheckingSubscription?: boolean;
	onSubscribe?: (tierId: string) => void;
}

export const SubscriptionPlanGrid = (props: SubscriptionPlanCardProps) => {
	const isAccountMode = props.mode === "account";
	const currentTier: string | null =
		isAccountMode && props.isCurrent
			? props.isCurrent("pro")
				? "pro"
				: props.isCurrent("hobby")
					? "hobby"
					: null
			: null;

	const [changePlanModal, setChangePlanModal] = React.useState<{
		open: boolean;
		targetTierId: string | null;
		action: "upgrade" | "downgrade" | null;
	}>({ open: false, targetTierId: null, action: null });

	const handleUpgradeOrDowngrade = (planId: string) => {
		const isUpgrade = currentTier === "hobby" && planId === "pro";
		const isDowngrade = currentTier === "pro" && planId === "hobby";
		if (isUpgrade || isDowngrade) {
			setChangePlanModal({
				open: true,
				targetTierId: planId,
				action: isUpgrade ? "upgrade" : "downgrade",
			});
		} else {
			props.onSubscribe?.(planId);
		}
	};

	const handleConfirmChangePlan = (tierId: string) => {
		props.onSubscribe?.(tierId);
	};

	return (
		<>
			{isAccountMode && (
				<ChangePlanModal
					open={changePlanModal.open}
					onOpenChange={(open) =>
						setChangePlanModal((prev) =>
							open ? prev : { open: false, targetTierId: null, action: null },
						)
					}
					targetTierId={changePlanModal.targetTierId}
					action={changePlanModal.action}
					onConfirm={handleConfirmChangePlan}
					isLoading={props.isLoading}
				/>
			)}
			{subscriptionPlans.map((plan) => {
		const meta = SubscriptionPricingMeta[plan.id];
		const Icon = SubscriptionIconMap[plan.icon];

		const isCurrent =
			isAccountMode && props.isCurrent ? props.isCurrent(plan.id) : false;

		const cardClasses = `flex flex-col border-2 relative ${
			meta.highlight ? "border-primary bg-primary/5" : ""
		}`;

		const priceStrikeThrough =
			plan.id === "pro" ? "$25" : plan.id === "hobby" ? "$15" : undefined;

		return (
			<Card key={plan.id} className={cardClasses}>
				{isAccountMode && isCurrent && (
					<div className="absolute -top-3 right-4">
						<span className="bg-green-500 text-white text-xs font-bold px-3 py-1 rounded-full">
							Current Plan
						</span>
					</div>
				)}
				{meta.badge && (
					<div className="absolute -top-3 left-1/2 -translate-x-1/2">
						<span className="bg-primary text-white text-xs font-bold px-3 py-1 rounded-full">
							{meta.badge}
						</span>
					</div>
				)}
				<CardHeader>
					<div className="flex items-center gap-2 mb-2">
						<Icon className="w-5 h-5 text-primary" />
						<CardTitle className="text-xl">{plan.name}</CardTitle>
					</div>
					<CardDescription>{meta.description}</CardDescription>
					<div className="mt-4">
						<span className="text-4xl font-bold">${plan.price}</span>
						{priceStrikeThrough && (
							<span className="text-muted-foreground line-through ml-2 text-sm">
								{priceStrikeThrough}
							</span>
						)}
						<span className="text-muted-foreground">/month</span>
					</div>
					{plan.id === "pro" && (
						<p className="text-primary text-xs font-semibold mt-1">
							Early deal - Limited time
						</p>
					)}
				</CardHeader>
				<CardContent className="flex-1">
					<ul className="space-y-3">
						{plan.features.map((feature) => (
							<li key={feature} className="flex items-center gap-3 text-sm">
								<Check className="h-4 w-4 text-green-500 shrink-0" />
								{feature}
							</li>
						))}
					</ul>
				</CardContent>
				<CardFooter>
					{isAccountMode ? (
						<Button
							variant={plan.id === "hobby" ? "outline" : "default"}
							className={`w-full h-12 rounded-full text-base ${
								plan.id === "pro"
									? "bg-primary text-white hover:bg-primary/90"
									: ""
							}`}
							onClick={() => handleUpgradeOrDowngrade(plan.id)}
							disabled={
								props.isLoading || props.isCheckingSubscription || isCurrent
							}
						>
							{isCurrent
								? "Current Plan"
								: currentTier === "pro" && plan.id === "hobby"
									? "Downgrade"
									: currentTier === "hobby" && plan.id === "pro"
										? "Upgrade"
										: "Start 3-day free trial"}
						</Button>
					) : (
						<Link to="/projects" className="w-full">
							<Button
								variant={plan.id === "hobby" ? "outline" : "default"}
								className={`w-full h-12 rounded-full text-base ${
									plan.id === "pro"
										? "bg-primary text-white hover:bg-primary/90"
										: ""
								}`}
							>
								Start 3-day free trial
							</Button>
						</Link>
					)}
				</CardFooter>
			</Card>
		);
	})}
		</>
	);
};
