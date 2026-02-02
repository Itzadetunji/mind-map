import type { SubscriptionTier } from "./database.constants";

// Subscription plans - Only Hobby and Pro
export const subscriptionPlans: {
	id: SubscriptionTier;
	name: string;
	price: number;
	initialCredits: number;
	monthlyCredits: number;
	dailyCredits: number;
	features: string[];
	popular: boolean;
	icon: React.ReactNode;
}[] = [
	{
		id: "hobby",
		name: "Hobby",
		price: 9.99,
		initialCredits: 35,
		monthlyCredits: 30,
		dailyCredits: 5,
		features: [
			"20 Projects",
			"35 credits a month",
			"5 daily credits (up to 150/month)",
			"Unlimited document export",
			"Unlimited photo exports",
			"Share documents",
		],
		popular: true,
		icon: "Star",
	},
	{
		id: "pro",
		name: "Pro",
		price: 24.99,
		initialCredits: 70,
		monthlyCredits: 150,
		dailyCredits: 5,
		features: [
			"Everything in Hobby",
			"Unlimited projects",
			"70 credits + 5 everyday",
			"Team collaboration (coming soon)",
			"Priority Support",
			"Early access to new features",
		],
		popular: false,
		icon: "Crown",
	},
];
