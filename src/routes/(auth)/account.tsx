import { createFileRoute } from "@tanstack/react-router";
import { Check, RefreshCw, Subscript, Zap } from "lucide-react";
import { toast } from "sonner";

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
	getTierMonthlyCredits,
	getTierPrice,
	useUserCredits,
	useUserSubscription,
} from "@/hooks/credits.hooks";
import { subscriptionPlans } from "@/lib/constants";
import {
	SubscriptionTier,
	type SubscriptionTierType,
} from "@/lib/database.types";
import { createDodoCheckoutSession } from "@/server/v1/checkout/dodo-checkout";
import { useAuthStore } from "@/stores/authStore";

function AccountPage() {
	const { user } = useAuthStore();
	const { data: subscription, isLoading: subscriptionLoading } =
		useUserSubscription();
	const { data: credits, isLoading: creditsLoading } = useUserCredits();

	const handleSubscribe = async (tier: SubscriptionTierType) => {
		if (tier === SubscriptionTier.FREE) {
			return;
		}

		try {
			const { checkoutUrl } = await createDodoCheckoutSession({
				data: {
					tier: "hobby",
					email: user?.email as string,
					name: user?.user_metadata?.full_name as string,
				},
			});

			window.location.assign(checkoutUrl);
		} catch (error) {
			const message =
				error instanceof Error
					? error.message
					: "Unable to start Dodo checkout";
			toast.error("Dodo checkout unavailable", {
				description: message,
			});
		}
	};

	const currentTier = subscription?.tier || null;
	const hasActiveSubscription = !!subscription?.tier;
	const isLoading = subscriptionLoading || creditsLoading;

	if (isLoading) {
		return (
			<main className="w-full flex-1 flex items-center justify-center bg-slate-50 dark:bg-slate-950">
				<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary dark:border-[#0077B6]" />
			</main>
		);
	}

	return (
		<main className="w-full flex-1 overflow-auto bg-slate-50 dark:bg-slate-950">
			<div className="max-w-6xl mx-auto px-4 py-8 flex flex-col gap-8">
				{/* Page header */}
				<div className="">
					<h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">
						Account
					</h1>
					<p className="text-slate-600 dark:text-slate-400 mt-1">
						Manage your subscription and AI credits
					</p>
				</div>

				{/* User info */}
				<div className="pt-8 border-t border-slate-200 dark:border-slate-800">
					<h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-4">
						Account Details
					</h2>
					<Card>
						<CardContent className="p-4">
							<div className="flex items-center gap-4">
								{user?.user_metadata?.avatar_url && (
									<img
										src={user.user_metadata.avatar_url}
										alt="Profile"
										className="w-12 h-12 rounded-full"
									/>
								)}
								<div>
									<p className="font-medium text-slate-900 dark:text-slate-100">
										{user?.user_metadata?.full_name || user?.email}
									</p>
									<p className="text-sm text-slate-500">{user?.email}</p>
								</div>
							</div>
						</CardContent>
					</Card>
				</div>

				{/* Credits overview */}
				<Card className=" bg-linear-to-br from-primary to-[#023E8A] dark:from-[#0077B6] dark:to-[#0096C7] text-white border-0">
					<CardHeader className="pb-2">
						<div className="flex items-center justify-between">
							<CardDescription className="text-white/80">
								Available Credits
							</CardDescription>
							{hasActiveSubscription ? (
								<span className="px-3 py-1 bg-white/20 rounded-full text-sm font-medium capitalize">
									{currentTier} Plan
								</span>
							) : (
								<span className="px-3 py-1 bg-white/20 rounded-full text-sm font-medium">
									No Subscription
								</span>
							)}
						</div>
						<CardTitle className="text-5xl font-bold">
							{credits?.credits ?? 0}
							<span className="text-2xl font-normal ml-2 text-white/80">
								credits
							</span>
						</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="flex items-center gap-4 text-white/80">
							<div className="flex items-center gap-2">
								<RefreshCw className="w-4 h-4" />
								{hasActiveSubscription ? (
									<span>
										5 daily credits (up to {getTierMonthlyCredits(currentTier)}
										/month)
									</span>
								) : (
									<span>Subscribe to earn daily credits</span>
								)}
							</div>
						</div>
					</CardContent>
				</Card>

				{/* Subscription Plans */}
				<div className="mb-10">
					<h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-2">
						Subscription Plans
					</h2>
					<p className="text-slate-600 dark:text-slate-400 mb-4">
						Choose a plan that fits your needs. Earn daily credits upon login.
					</p>
					<div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-3xl">
						{subscriptionPlans.map((plan) => {
							const isCurrentPlan = currentTier === plan.id;
							return (
								<Card
									key={plan.id}
									className={`relative ${plan.popular ? "border-primary dark:border-[#0077B6] border-2" : ""} ${isCurrentPlan ? "ring-2 ring-primary dark:ring-[#0077B6] ring-offset-2" : ""}`}
								>
									{plan.popular && (
										<div className="absolute -top-3 left-1/2 -translate-x-1/2">
											<span className="bg-primary dark:bg-[#0077B6] text-white text-xs font-medium px-3 py-1 rounded-full">
												Most Popular
											</span>
										</div>
									)}
									{isCurrentPlan && (
										<div className="absolute -top-3 right-4">
											<span className="bg-green-500 text-white text-xs font-medium px-3 py-1 rounded-full">
												Current Plan
											</span>
										</div>
									)}
									<CardHeader>
										<CardTitle className="flex items-center justify-between">
											<span className="flex items-center gap-2">
												<span
													className={
														plan.popular
															? "text-primary dark:text-[#0077B6]"
															: "text-slate-400"
													}
												>
													{plan.icon}
												</span>
												{plan.name}
											</span>
										</CardTitle>
										<CardDescription>
											<span className="text-3xl font-bold text-slate-900 dark:text-slate-100">
												${plan.price}
											</span>
											<span className="text-slate-500">/month</span>
										</CardDescription>
									</CardHeader>
									<CardContent>
										<div className="flex items-center gap-2 mb-4 p-2 bg-primary/10 dark:bg-[#0077B6]/20 rounded-lg">
											<Zap className="w-4 h-4 text-primary dark:text-[#0077B6]" />
											<span className="font-semibold text-primary dark:text-[#0077B6]">
												{plan.initialCredits} initial + {plan.dailyCredits}/day
											</span>
										</div>
										<ul className="space-y-2">
											{plan.features.map((feature) => (
												<li
													key={feature}
													className="flex items-start gap-2 text-sm"
												>
													<Check className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
													<span className="text-slate-600 dark:text-slate-400">
														{feature}
													</span>
												</li>
											))}
										</ul>
									</CardContent>
									<CardFooter>
										{isCurrentPlan ? (
											<Button className="w-full" variant="outline" disabled>
												Current Plan
											</Button>
										) : (
											<Button
												className="w-full"
												variant={plan.popular ? "default" : "outline"}
												onClick={() => handleSubscribe(plan.id)}
											>
												{!hasActiveSubscription
													? "Subscribe"
													: getTierPrice(currentTier) < plan.price
														? "Upgrade"
														: "Switch"}
											</Button>
										)}
									</CardFooter>
								</Card>
							);
						})}
					</div>
				</div>
			</div>
		</main>
	);
}

export const Route = createFileRoute("/(auth)/account")({
	component: AccountPage,
});
