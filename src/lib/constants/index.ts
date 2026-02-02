import { Crown, Star } from "lucide-react";
import { SubscriptionTier, type SubscriptionTierType } from "../database.types";

type PlanTier = Exclude<SubscriptionTierType, typeof SubscriptionTier.FREE>;

// Subscription plans - Only Hobby and Pro
export const subscriptionPlans: {
	id: PlanTier;
	name: string;
	price: number;
	initialCredits: number;
	monthlyCredits: number;
	dailyCredits: number;
	features: string[];
	popular: boolean;
	icon: keyof typeof SubscriptionIconMap;
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

export const SubscriptionIconMap = {
	Star: Star,
	Crown: Crown,
} as const;

export const SubscriptionPricingMeta = {
	[SubscriptionTier.HOBBY]: {
		description: "Perfect for getting started with your side projects",
		badge: null,
		highlight: false,
	},
	[SubscriptionTier.PRO]: {
		description: "For serious founders who want to ship faster.",
		badge: "Best Value",
		highlight: true,
	},
} as const satisfies Record<
	PlanTier,
	{
		description: string;
		badge: string | null;
		highlight: boolean;
	}
>;
