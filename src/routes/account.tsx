import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
	ArrowLeft,
	Check,
	Clock,
	CreditCard,
	Crown,
	Gift,
	Minus,
	Plus,
	RefreshCw,
	Sparkles,
	Star,
	Zap,
} from "lucide-react";
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
	getTierTopUpBonus,
	useCreditTransactions,
	useUserCredits,
	useUserSubscription,
} from "@/hooks/credits.hooks";
import type { CreditTransaction, SubscriptionTier } from "@/lib/database.types";
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

function getTransactionIcon(type: CreditTransaction["transaction_type"]) {
	switch (type) {
		case "initial":
			return <Gift className="w-4 h-4 text-green-500" />;
		case "subscription":
			return <Star className="w-4 h-4 text-indigo-500" />;
		case "purchase":
			return <CreditCard className="w-4 h-4 text-blue-500" />;
		case "usage":
			return <Minus className="w-4 h-4 text-orange-500" />;
		case "bonus":
			return <Sparkles className="w-4 h-4 text-purple-500" />;
		case "refund":
			return <RefreshCw className="w-4 h-4 text-green-500" />;
		case "monthly_reset":
			return <RefreshCw className="w-4 h-4 text-indigo-500" />;
		default:
			return <Zap className="w-4 h-4 text-slate-500" />;
	}
}

function formatDate(dateString: string) {
	const date = new Date(dateString);
	return date.toLocaleDateString("en-US", {
		month: "short",
		day: "numeric",
		year: "numeric",
		hour: "numeric",
		minute: "2-digit",
	});
}

function AccountPage() {
	const navigate = useNavigate();
	const { user, loading: authLoading } = useAuthStore();
	const { data: subscription, isLoading: subscriptionLoading } =
		useUserSubscription();
	const { data: credits, isLoading: creditsLoading } = useUserCredits();
	const { data: transactions, isLoading: transactionsLoading } =
		useCreditTransactions();

	// Redirect to home if not authenticated
	if (!authLoading && !user) {
		navigate({ to: "/" });
		return null;
	}

	const handleSubscribe = (tier: SubscriptionTier) => {
		// TODO: Integrate with Stripe for subscription
		alert(
			`Subscription to ${tier} plan would be processed via Stripe. This will be implemented with Stripe Checkout.`,
		);
	};

	const handlePurchaseCredits = (packageId: string) => {
		// TODO: Integrate with Stripe for one-time purchase
		alert(
			`Credit purchase for ${packageId} package would be processed via Stripe. This will be implemented with Stripe Checkout.`,
		);
	};

	const currentTier = subscription?.tier || "free";
	const isLoading = authLoading || subscriptionLoading || creditsLoading;

	if (isLoading) {
		return (
			<main className="w-full flex-1 flex items-center justify-center bg-slate-50 dark:bg-slate-950">
				<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
			</main>
		);
	}

	return (
		<main className="w-full flex-1 overflow-auto bg-slate-50 dark:bg-slate-950">
			<div className="max-w-6xl mx-auto px-4 py-8">
				{/* Back button */}
				<Link
					to="/"
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
				<Card className="mb-8 bg-linear-to-br from-indigo-500 to-purple-600 text-white border-0">
					<CardHeader className="pb-2">
						<div className="flex items-center justify-between">
							<CardDescription className="text-indigo-100">
								Available Credits
							</CardDescription>
							<span className="px-3 py-1 bg-white/20 rounded-full text-sm font-medium capitalize">
								{currentTier} Plan
							</span>
						</div>
						<CardTitle className="text-5xl font-bold">
							{credits?.credits ?? 0}
							<span className="text-2xl font-normal ml-2 text-indigo-200">
								credits
							</span>
						</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="flex items-center gap-4 text-indigo-100">
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
									className={`relative ${plan.popular ? "border-indigo-500 border-2" : ""} ${isCurrentPlan ? "ring-2 ring-indigo-500 ring-offset-2" : ""}`}
								>
									{plan.popular && (
										<div className="absolute -top-3 left-1/2 -translate-x-1/2">
											<span className="bg-indigo-500 text-white text-xs font-medium px-3 py-1 rounded-full">
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
														plan.popular ? "text-indigo-500" : "text-slate-400"
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
										<div className="flex items-center gap-2 mb-4 p-2 bg-indigo-50 dark:bg-indigo-950 rounded-lg">
											<Zap className="w-4 h-4 text-indigo-500" />
											<span className="font-semibold text-indigo-700 dark:text-indigo-300">
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
							<span className="ml-1 text-indigo-600 dark:text-indigo-400 font-medium">
								Pro members get 20% bonus credits on all purchases!
							</span>
						)}
					</p>
					<div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl">
						{creditPackages.map((pkg) => {
							const bonusMultiplier = 1 + getTierTopUpBonus(currentTier);
							const totalCredits = Math.floor(pkg.baseCredits * bonusMultiplier);
							const bonusCredits = totalCredits - pkg.baseCredits;

							return (
								<Card
									key={pkg.id}
									className={`relative ${pkg.popular ? "border-indigo-500 border-2" : ""}`}
								>
									{pkg.popular && (
										<div className="absolute -top-3 left-1/2 -translate-x-1/2">
											<span className="bg-indigo-500 text-white text-xs font-medium px-3 py-1 rounded-full">
												Best Value
											</span>
										</div>
									)}
									<CardHeader className="pb-2">
										<CardTitle className="flex items-center justify-between">
											<span className="flex items-center gap-2">
												<Zap
													className={`w-5 h-5 ${pkg.popular ? "text-indigo-500" : "text-slate-400"}`}
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

				{/* Transaction history */}
				<div className="mb-8">
					<h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-4">
						Transaction History
					</h2>
					<Card>
						<CardContent className="p-0">
							{transactionsLoading ? (
								<div className="p-8 text-center">
									<div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600 mx-auto" />
								</div>
							) : transactions && transactions.length > 0 ? (
								<div className="divide-y divide-slate-200 dark:divide-slate-800">
									{transactions.map((transaction) => (
										<div
											key={transaction.id}
											className="flex items-center justify-between p-4 hover:bg-slate-50 dark:hover:bg-slate-900/50"
										>
											<div className="flex items-center gap-3">
												<div className="p-2 rounded-full bg-slate-100 dark:bg-slate-800">
													{getTransactionIcon(transaction.transaction_type)}
												</div>
												<div>
													<p className="font-medium text-slate-900 dark:text-slate-100 capitalize">
														{transaction.transaction_type.replace("_", " ")}
													</p>
													<p className="text-sm text-slate-500">
														{transaction.description || "No description"}
													</p>
												</div>
											</div>
											<div className="text-right">
												<p
													className={`font-semibold ${transaction.amount > 0 ? "text-green-600" : "text-orange-600"}`}
												>
													{transaction.amount > 0 ? "+" : ""}
													{transaction.amount} credits
												</p>
												<p className="text-xs text-slate-500 flex items-center gap-1 justify-end">
													<Clock className="w-3 h-3" />
													{formatDate(transaction.created_at)}
												</p>
											</div>
										</div>
									))}
								</div>
							) : (
								<div className="p-8 text-center text-slate-500">
									<Zap className="w-8 h-8 mx-auto mb-2 opacity-50" />
									<p>No transactions yet</p>
									<p className="text-sm">
										Your credit usage history will appear here
									</p>
								</div>
							)}
						</CardContent>
					</Card>
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
		</main>
	);
}

export const Route = createFileRoute("/account")({
	component: AccountPage,
});
