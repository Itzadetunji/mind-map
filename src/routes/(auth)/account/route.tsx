import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Check, Loader2, RefreshCw } from "lucide-react";
import React, { useEffect } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { useCreateCheckout } from "@/api/http/v1/checkout/checkout.hooks";
import {
	getTierMonthlyCredits,
	useDodoSubscriptionStatus,
	useUserCredits,
	useUserSubscription,
} from "@/api/http/v1/credits/credits.hooks";
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
import {
	SubscriptionTier,
	type SubscriptionTierType,
} from "@/lib/database.types";
import { SubscriptionSuccessModal } from "@/routes/(auth)/projects/-components/SubscriptionSuccessModal";
import { useAuthStore } from "@/stores/authStore";

const AccountPage = () => {
	const { user } = useAuthStore();
	const navigate = useNavigate();
	const search = Route.useSearch();
	const userSubscriptionQuery = useUserSubscription();
	const userCreditsQuery = useUserCredits();

	const isCheckoutSuccessful =
		search.checkout === "complete" &&
		(search.subscription === SubscriptionTier.HOBBY ||
			search.subscription === SubscriptionTier.PRO);

	const dodoStatusQuery = useDodoSubscriptionStatus({
		enabled: isCheckoutSuccessful,
		refetchInterval: isCheckoutSuccessful ? 5000 : false,
	});

	const [showSuccessModal, setShowSuccessModal] = React.useState(false);
	const createCheckout = useCreateCheckout();

	const handleSubscribe = async (tier: SubscriptionTierType) => {
		if (tier === SubscriptionTier.FREE) return;

		try {
			const { checkoutUrl } = await createCheckout.mutateAsync({ tier });
			console.log(checkoutUrl);
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

	const isLoading = createCheckout.isPending;

	const currentTier = userSubscriptionQuery.data?.tier || null;
	const hasActiveSubscription =
		dodoStatusQuery.data?.status?.toLowerCase() === "active";
	const isCurrentTier = (tier: SubscriptionTierType) => currentTier === tier;
	const isCheckingSubscription = dodoStatusQuery.isFetching;

	const handleSuccessModalChange = (open: boolean) => {
		if (!open) {
			navigate({ to: "/account", replace: true });
		}
	};

	useEffect(() => {
		if (dodoStatusQuery.data?.status === "active") setShowSuccessModal(true);
	}, [search.checkout, search.subscription]);

	if (
		userSubscriptionQuery.isLoading ||
		userCreditsQuery.isLoading ||
		dodoStatusQuery.isLoading
	) {
		return (
			<main className="w-full flex-1 flex items-center justify-center bg-slate-50 dark:bg-slate-950">
				<Loader2 className="w-4 h-4 mr-2 animate-spin" />
			</main>
		);
	}

	return (
		<>
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
								{userCreditsQuery.data?.credits ?? 0}
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
											5 daily credits (up to{" "}
											{getTierMonthlyCredits(currentTier)}
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
					<div className="pb-10 flex flex-col items-stretch gap-6">
						<div className="flex flex-col">
							<h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-2">
								Subscription Plans
							</h2>
							<p className="text-slate-600 dark:text-slate-400">
								Choose a plan that fits your needs. Earn daily credits upon
								login.
							</p>
						</div>
						<div className="flex flex-col lg:flex-row gap-4 justify-center w-full">
							{subscriptionPlans.map((plan) => {
								const meta = SubscriptionPricingMeta[plan.id];
								const Icon = SubscriptionIconMap[plan.icon];
								const isCurrent = isCurrentTier(plan.id);

								return (
									<Card
										key={plan.id}
										className={`flex flex-col border-2 relative max-w-100 ${meta.highlight ? "border-primary bg-primary/5" : ""}`}
									>
										{isCurrent && (
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
												<span className="text-4xl font-bold">
													${plan.price}
												</span>
												{plan.id === "pro" && (
													<span className="text-muted-foreground line-through ml-2 text-sm">
														$40
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
													<li
														key={feature}
														className="flex items-center gap-3 text-sm"
													>
														<Check className="h-4 w-4 text-green-500 shrink-0" />
														{feature}
													</li>
												))}
											</ul>
										</CardContent>
										<CardFooter>
											<Button
												variant={plan.id === "hobby" ? "outline" : "default"}
												className={`w-full h-12 rounded-full text-base ${plan.id === "pro" ? "bg-primary text-white hover:bg-primary/90" : ""}`}
												onClick={() => handleSubscribe(plan.id)}
												disabled={
													isLoading || isCurrent || isCheckingSubscription
												}
											>
												{isCurrent ? "Current Plan" : "Start 3-day free trial"}
											</Button>
										</CardFooter>
									</Card>
								);
							})}
						</div>
					</div>
				</div>
			</main>

			<SubscriptionSuccessModal
				open={showSuccessModal}
				onOpenChange={handleSuccessModalChange}
				subscriptionTier={search.subscription as SubscriptionTierType}
			/>
		</>
	);
};

export const Route = createFileRoute("/(auth)/account")({
	component: AccountPage,
	validateSearch: z.object({
		checkout: z.string().optional(),
		subscription: z.string().optional(),
	}),
});
