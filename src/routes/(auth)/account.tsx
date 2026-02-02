import { createFileRoute, Link } from "@tanstack/react-router";
import {
	ArrowLeft,
	Check,
	CreditCard,
	Crown,
	Plus,
	RefreshCw,
	Star,
	Zap,
} from "lucide-react";
import { useState } from "react";
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
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import {
	getTierMonthlyCredits,
	getTierPrice,
	getTierTopUpBonus,
	useUserCredits,
	useUserSubscription,
} from "@/hooks/credits.hooks";
import type { SubscriptionTier } from "@/lib/database.types";
import { useAuthStore } from "@/stores/authStore";

// Subscription plans
const subscriptionPlans: {
	id: SubscriptionTier;
	name: string;
	price: number;
	credits: number;
	features: string[];
	popular: boolean;
	icon: React.ReactNode;
}[] = [
	{
		id: "free",
		name: "Free",
		price: 0,
		credits: 30,
		features: [
			"30 AI credits per month",
			"Basic AI generations",
			"Limited to 5 maps per month",
			"Export to PNG",
			"Community support",
		],
		popular: false,
		icon: <Zap className="w-5 h-5" />,
	},
	{
		id: "hobby",
		name: "Hobby",
		price: 9,
		credits: 75,
		features: [
			"75 AI credits per month",
			"Unlimited maps",
			"Export to PNG & Markdown",
			"Priority support",
			"AI chat assistant",
		],
		popular: true,
		icon: <Star className="w-5 h-5" />,
	},
	{
		id: "pro",
		name: "Pro",
		price: 25,
		credits: 150,
		features: [
			"150 AI credits per month",
			"Unlimited maps",
			"All export formats (PNG, Markdown, PRD)",
			"Advanced AI features",
			"20% bonus on credit top-ups",
			"Team collaboration (coming soon)",
		],
		popular: false,
		icon: <Crown className="w-5 h-5" />,
	},
];

// Credit top-up packages (base credits before tier bonuses)
const creditPackages = [
	{
		id: "small",
		baseCredits: 60,
		price: 5,
		popular: false,
		description: "Quick top-up",
	},
	{
		id: "large",
		baseCredits: 150,
		price: 10,
		popular: true,
		description: "Best value",
	},
];

function AccountPage() {
	const { user } = useAuthStore();
	const { data: subscription, isLoading: subscriptionLoading } =
		useUserSubscription();
	const { data: credits, isLoading: creditsLoading } = useUserCredits();

	const [showSubscriptionDialog, setShowSubscriptionDialog] = useState(false);
	const [showCreditsDialog, setShowCreditsDialog] = useState(false);
	const [selectedTier, setSelectedTier] = useState<SubscriptionTier | null>(
		null,
	);
	const [selectedPackageId, setSelectedPackageId] = useState<string | null>(
		null,
	);

	const handleSubscribe = (tier: SubscriptionTier) => {
		// TODO: Integrate with Stripe for subscription
		setSelectedTier(tier);
		setShowSubscriptionDialog(true);
	};

	const handlePurchaseCredits = (packageId: string) => {
		// TODO: Integrate with Stripe for one-time purchase
		setSelectedPackageId(packageId);
		setShowCreditsDialog(true);
	};

	const currentTier = subscription?.tier || "free";
	const isLoading = subscriptionLoading || creditsLoading;

	if (isLoading) {
		return (
			<main className="w-full flex-1 flex items-center justify-center bg-slate-50 dark:bg-slate-950">
				<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#03045E] dark:border-[#0077B6]" />
			</main>
		);
	}

	return (
		<main className="w-full flex-1 overflow-auto bg-slate-50 dark:bg-slate-950">
			<div className="max-w-6xl mx-auto px-4 py-8">
				{/* Back button */}
				<Link
					to="/projects"
					className="inline-flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 mb-6"
				>
					<ArrowLeft className="w-4 h-4" />
					Back to Projects
				</Link>

				{/* Page header */}
				<div className="mb-8">
					<h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">
						Account
					</h1>
					<p className="text-slate-600 dark:text-slate-400 mt-1">
						Manage your subscription and AI credits
					</p>
				</div>

				{/* Credits overview */}
				<Card className="mb-8 bg-linear-to-br from-[#03045E] to-[#023E8A] dark:from-[#0077B6] dark:to-[#0096C7] text-white border-0">
					<CardHeader className="pb-2">
						<div className="flex items-center justify-between">
							<CardDescription className="text-white/80">
								Available Credits
							</CardDescription>
							<span className="px-3 py-1 bg-white/20 rounded-full text-sm font-medium capitalize">
								{currentTier} Plan
							</span>
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
								<span>
									{getTierMonthlyCredits(currentTier)} credits/month with your
									plan
								</span>
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
						Choose a plan that fits your needs. Credits refresh monthly.
					</p>
					<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
						{subscriptionPlans.map((plan) => {
							const isCurrentPlan = currentTier === plan.id;
							return (
								<Card
									key={plan.id}
									className={`relative ${plan.popular ? "border-[#03045E] dark:border-[#0077B6] border-2" : ""} ${isCurrentPlan ? "ring-2 ring-[#03045E] dark:ring-[#0077B6] ring-offset-2" : ""}`}
								>
									{plan.popular && (
										<div className="absolute -top-3 left-1/2 -translate-x-1/2">
											<span className="bg-[#03045E] dark:bg-[#0077B6] text-white text-xs font-medium px-3 py-1 rounded-full">
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
															? "text-[#03045E] dark:text-[#0077B6]"
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
										<div className="flex items-center gap-2 mb-4 p-2 bg-[#03045E]/10 dark:bg-[#0077B6]/20 rounded-lg">
											<Zap className="w-4 h-4 text-[#03045E] dark:text-[#0077B6]" />
											<span className="font-semibold text-[#03045E] dark:text-[#0077B6]">
												{plan.credits} credits/month
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
										) : plan.id === "free" ? (
											<Button
												className="w-full"
												variant="outline"
												onClick={() => handleSubscribe(plan.id)}
											>
												Downgrade
											</Button>
										) : (
											<Button
												className="w-full"
												variant={plan.popular ? "default" : "outline"}
												onClick={() => handleSubscribe(plan.id)}
											>
												{getTierPrice(currentTier) < plan.price
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

				{/* Credit Top-ups */}
				<div className="mb-10">
					<h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-2">
						Need More Credits?
					</h2>
					<p className="text-slate-600 dark:text-slate-400 mb-4">
						Purchase additional credits anytime. These don't expire and stack
						with your monthly allowance.
						{currentTier === "pro" && (
							<span className="ml-1 text-[#03045E] dark:text-[#0077B6] font-medium">
								Pro members get 20% bonus credits on all purchases!
							</span>
						)}
					</p>
					<div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl">
						{creditPackages.map((pkg) => {
							const bonusMultiplier = 1 + getTierTopUpBonus(currentTier);
							const totalCredits = Math.floor(
								pkg.baseCredits * bonusMultiplier,
							);
							const bonusCredits = totalCredits - pkg.baseCredits;

							return (
								<Card
									key={pkg.id}
									className={`relative ${pkg.popular ? "border-[#03045E] dark:border-[#0077B6] border-2" : ""}`}
								>
									{pkg.popular && (
										<div className="absolute -top-3 left-1/2 -translate-x-1/2">
											<span className="bg-[#03045E] dark:bg-[#0077B6] text-white text-xs font-medium px-3 py-1 rounded-full">
												Best Value
											</span>
										</div>
									)}
									<CardHeader className="pb-2">
										<CardTitle className="flex items-center justify-between">
											<span className="flex items-center gap-2">
												<Zap
													className={`w-5 h-5 ${pkg.popular ? "text-[#03045E] dark:text-[#0077B6]" : "text-slate-400"}`}
												/>
												<span>
													{totalCredits} Credits
													{bonusCredits > 0 && (
														<span className="text-sm font-normal text-green-600 ml-1">
															(+{bonusCredits} bonus)
														</span>
													)}
												</span>
											</span>
											<span className="text-2xl font-bold">${pkg.price}</span>
										</CardTitle>
										<CardDescription>{pkg.description}</CardDescription>
									</CardHeader>
									<CardContent className="pb-2">
										<p className="text-sm text-slate-500">
											${(pkg.price / totalCredits).toFixed(3)} per credit
										</p>
									</CardContent>
									<CardFooter>
										<Button
											className="w-full"
											variant={pkg.popular ? "default" : "outline"}
											onClick={() => handlePurchaseCredits(pkg.id)}
										>
											<Plus className="w-4 h-4 mr-2" />
											Purchase
										</Button>
									</CardFooter>
								</Card>
							);
						})}
					</div>
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
			</div>

			{/* Subscription Dialog */}
			<Dialog
				open={showSubscriptionDialog}
				onOpenChange={setShowSubscriptionDialog}
			>
				<DialogContent className="sm:max-w-md">
					<DialogHeader>
						<div className="flex items-center gap-3 mb-2">
							<div className="p-2 rounded-full bg-[#03045E]/10 dark:bg-[#0077B6]/20">
								<CreditCard className="w-6 h-6 text-[#03045E] dark:text-[#0077B6]" />
							</div>
							<DialogTitle className="text-xl">Subscription</DialogTitle>
						</div>
						<DialogDescription className="text-base pt-2">
							Subscription to {selectedTier} plan would be processed via Stripe.
							This will be implemented with Stripe Checkout.
						</DialogDescription>
					</DialogHeader>
					<DialogFooter>
						<Button
							variant="outline"
							onClick={() => setShowSubscriptionDialog(false)}
						>
							Cancel
						</Button>
						<Button onClick={() => setShowSubscriptionDialog(false)}>OK</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* Credits Purchase Dialog */}
			<Dialog open={showCreditsDialog} onOpenChange={setShowCreditsDialog}>
				<DialogContent className="sm:max-w-md">
					<DialogHeader>
						<div className="flex items-center gap-3 mb-2">
							<div className="p-2 rounded-full bg-[#03045E]/10 dark:bg-[#0077B6]/20">
								<Zap className="w-6 h-6 text-[#03045E] dark:text-[#0077B6]" />
							</div>
							<DialogTitle className="text-xl">Credit Purchase</DialogTitle>
						</div>
						<DialogDescription className="text-base pt-2">
							Credit purchase for {selectedPackageId} package would be processed
							via Stripe. This will be implemented with Stripe Checkout.
						</DialogDescription>
					</DialogHeader>
					<DialogFooter>
						<Button
							variant="outline"
							onClick={() => setShowCreditsDialog(false)}
						>
							Cancel
						</Button>
						<Button onClick={() => setShowCreditsDialog(false)}>OK</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</main>
	);
}

export const Route = createFileRoute("/(auth)/account")({
	component: AccountPage,
});
