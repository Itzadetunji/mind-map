import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
	CreditTransaction,
	SubscriptionTier,
	UserCredits,
	UserSubscription,
} from "@/lib/database.types";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/stores/authStore";

// Helper to get monthly credits for a tier
export function getTierMonthlyCredits(tier: SubscriptionTier): number {
	switch (tier) {
		case "free":
			return 30;
		case "hobby":
			return 75;
		case "pro":
			return 150;
		default:
			return 30;
	}
}

// Helper to get tier price
export function getTierPrice(tier: SubscriptionTier): number {
	switch (tier) {
		case "free":
			return 0;
		case "hobby":
			return 9;
		case "pro":
			return 25;
		default:
			return 0;
	}
}

// Helper to get top-up bonus percentage for a tier
export function getTierTopUpBonus(tier: SubscriptionTier): number {
	switch (tier) {
		case "pro":
			return 0.2; // 20% bonus on top-ups
		default:
			return 0;
	}
}

export function useUserSubscription() {
	const user = useAuthStore((state) => state.user);

	return useQuery({
		queryKey: ["userSubscription", user?.id],
		queryFn: async () => {
			if (!user) return null;

			const { data, error } = await supabase
				.from("user_subscriptions")
				.select("*")
				.eq("user_id", user.id)
				.single();

			if (error) {
				// If no record exists, create one with free tier
				if (error.code === "PGRST116") {
					const { data: newSub, error: insertError } = await supabase
						.from("user_subscriptions")
						.insert({ user_id: user.id, tier: "free" })
						.select()
						.single();

					if (insertError) throw insertError;
					return newSub as UserSubscription;
				}
				throw error;
			}
			return data as UserSubscription;
		},
		enabled: !!user,
	});
}

export function useUserCredits() {
	const user = useAuthStore((state) => state.user);

	return useQuery({
		queryKey: ["userCredits", user?.id],
		queryFn: async () => {
			if (!user) return null;

			const { data, error } = await supabase
				.from("user_credits")
				.select("*")
				.eq("user_id", user.id)
				.single();

			if (error) {
				// If no record exists, create one with free tier default (30 credits)
				if (error.code === "PGRST116") {
					const { data: newCredits, error: insertError } = await supabase
						.from("user_credits")
						.insert({
							user_id: user.id,
							credits: 30,
							monthly_credits_remaining: 30,
						})
						.select()
						.single();

					if (insertError) throw insertError;
					return newCredits as UserCredits;
				}
				throw error;
			}
			return data as UserCredits;
		},
		enabled: !!user,
	});
}

export function useCreditTransactions() {
	const user = useAuthStore((state) => state.user);

	return useQuery({
		queryKey: ["creditTransactions", user?.id],
		queryFn: async () => {
			if (!user) return [];

			const { data, error } = await supabase
				.from("credit_transactions")
				.select("*")
				.eq("user_id", user.id)
				.order("created_at", { ascending: false })
				.limit(50);

			if (error) throw error;
			return data as CreditTransaction[];
		},
		enabled: !!user,
	});
}

export function useDeductCredits() {
	const user = useAuthStore((state) => state.user);
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async ({
			amount,
			description,
		}: {
			amount: number;
			description: string;
		}) => {
			if (!user) throw new Error("User not authenticated");

			// Get current credits
			const { data: currentCredits, error: fetchError } = await supabase
				.from("user_credits")
				.select("credits")
				.eq("user_id", user.id)
				.single();

			if (fetchError) throw fetchError;
			if (currentCredits.credits < amount) {
				throw new Error("Insufficient credits");
			}

			// Deduct credits
			const { error: updateError } = await supabase
				.from("user_credits")
				.update({ credits: currentCredits.credits - amount })
				.eq("user_id", user.id);

			if (updateError) throw updateError;

			// Log transaction
			const { error: transactionError } = await supabase
				.from("credit_transactions")
				.insert({
					user_id: user.id,
					amount: -amount,
					transaction_type: "usage",
					description,
				});

			if (transactionError) {
				console.error("Failed to log transaction:", transactionError);
			}

			return { success: true };
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["userCredits", user?.id] });
			queryClient.invalidateQueries({
				queryKey: ["creditTransactions", user?.id],
			});
		},
	});
}

export function useAddCredits() {
	const user = useAuthStore((state) => state.user);
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async ({
			amount,
			transactionType,
			description,
		}: {
			amount: number;
			transactionType: "purchase" | "bonus" | "refund";
			description: string;
		}) => {
			if (!user) throw new Error("User not authenticated");

			// Get current credits
			const { data: currentCredits, error: fetchError } = await supabase
				.from("user_credits")
				.select("credits")
				.eq("user_id", user.id)
				.single();

			if (fetchError) throw fetchError;

			// Add credits
			const { error: updateError } = await supabase
				.from("user_credits")
				.update({ credits: currentCredits.credits + amount })
				.eq("user_id", user.id);

			if (updateError) throw updateError;

			// Log transaction
			const { error: transactionError } = await supabase
				.from("credit_transactions")
				.insert({
					user_id: user.id,
					amount: amount,
					transaction_type: transactionType,
					description,
				});

			if (transactionError) {
				console.error("Failed to log transaction:", transactionError);
			}

			return { success: true };
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["userCredits", user?.id] });
			queryClient.invalidateQueries({
				queryKey: ["creditTransactions", user?.id],
			});
		},
	});
}
