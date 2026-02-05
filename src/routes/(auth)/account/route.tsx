import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Loader2, User, XCircle } from "lucide-react";
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
import { useChangeSubscriptionPlan } from "@/api/http/v1/subscriptions/subscriptions.hooks";
import { SubscriptionPlanGrid } from "@/components/shared/SubscriptionPlanCard";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import {
	SubscriptionTier,
	type SubscriptionTierType,
} from "@/lib/database.types";
import { CancelSubscriptionModal } from "@/routes/(auth)/account/-components/CancelSubscriptionModal";
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
	const [showCancelModal, setShowCancelModal] = React.useState(false);
	const createCheckout = useCreateCheckout();
	const changePlan = useChangeSubscriptionPlan();

	const handleSubscribe = async (tier: SubscriptionTierType) => {
		if (tier === SubscriptionTier.FREE) return;

		const hasExistingSubscription =
			userSubscriptionQuery.data?.tier !== SubscriptionTier.FREE &&
			userSubscriptionQuery.data?.dodo_subscription_id;

		// If user has an existing subscription, use change plan API
		// Otherwise, create a new checkout session
		if (
			hasExistingSubscription &&
			userSubscriptionQuery.data?.dodo_subscription_id &&
			user?.id
		) {
			try {
				await changePlan.mutateAsync({
					subscriptionId: userSubscriptionQuery.data.dodo_subscription_id,
					tier: tier as "hobby" | "pro",
					userId: user.id,
				});
				toast.success("Subscription plan updated", {
					description: `Your plan has been changed to ${tier}.`,
				});
			} catch (error) {
				const message =
					error instanceof Error
						? error.message
						: "Unable to change subscription plan";
				toast.error("Failed to change plan", {
					description: message,
				});
			}
		} else {
			// New subscription - use checkout
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
		}
	};

	const isLoading = createCheckout.isPending || changePlan.isPending;

	const currentTier = userSubscriptionQuery.data?.tier || null;

	const hasActiveSubscription =
		userSubscriptionQuery.data?.tier !== SubscriptionTier.FREE;
	const isCurrentTier = (tier: SubscriptionTierType) => currentTier === tier;
	const isCancelledAndActive =
		hasActiveSubscription && userSubscriptionQuery.data?.cancel_at_period_end;
	const isCheckingSubscription = dodoStatusQuery.isFetching;

	const handleSuccessModalChange = (open: boolean) => {
		setShowSuccessModal(false);

		if (!open) {
			navigate({ to: "/account", replace: true });
		}
	};

	useEffect(() => {
		if (dodoStatusQuery.data?.status === "active" && isCheckoutSuccessful) {
			setShowSuccessModal(true);
		}
	}, [dodoStatusQuery.data?.status, isCheckoutSuccessful]);

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
										<Avatar className="h-12 w-12 rounded-lg">
											<AvatarImage
												src={user.user_metadata.avatar_url}
												alt="Profile"
											/>
											<AvatarFallback className="rounded-lg">
												<User className="size-6" />
											</AvatarFallback>
										</Avatar>
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
							<div className="flex flex-wrap items-center justify-between gap-4 text-white/80">
								{hasActiveSubscription ? (
									<span>
										5 daily credits (up to{" "}
										{getTierMonthlyCredits(
											currentTier as SubscriptionTierType | null,
										)}
										/month)
									</span>
								) : (
									<span>Subscribe to earn daily credits</span>
								)}

								{hasActiveSubscription && !isCancelledAndActive && (
									<Button
										variant="ghost"
										size="sm"
										className="text-white/90 hover:bg-white/20 hover:text-white cursor-pointer"
										onClick={() => setShowCancelModal(true)}
									>
										<XCircle className="w-4 h-4 mr-1.5" />
										Cancel subscription
									</Button>
								)}
								{isCancelledAndActive &&
									userSubscriptionQuery.data?.current_period_end && (
										<div className="flex items-center gap-2 px-3 py-1.5 bg-white/10 rounded-full text-sm border border-white/10">
											<div className="w-1.5 h-1.5 rounded-full bg-amber-300" />
											<span className="font-medium text-white/90">
												Access until{" "}
												{new Date(
													userSubscriptionQuery.data.current_period_end,
												).toLocaleDateString()}
											</span>
										</div>
									)}
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
							<SubscriptionPlanGrid
								mode="account"
								isCurrent={(tierId) =>
									isCurrentTier(tierId as SubscriptionTierType)
								}
								isLoading={isLoading}
								isCheckingSubscription={isCheckingSubscription}
								onSubscribe={(tierId) =>
									handleSubscribe(tierId as SubscriptionTierType)
								}
							/>
						</div>
					</div>
				</div>
			</main>

			<SubscriptionSuccessModal
				open={showSuccessModal}
				onOpenChange={handleSuccessModalChange}
				subscriptionTier={search.subscription as SubscriptionTierType}
			/>

			<CancelSubscriptionModal
				open={showCancelModal}
				onOpenChange={setShowCancelModal}
				subscriptionId={
					userSubscriptionQuery.data?.dodo_subscription_id ?? null
				}
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
