import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
	CreditTransaction,
	SubscriptionTier,
	UserCredits,
	UserSubscription,
} from "@/lib/database.types";
import {
	SUBSCRIPTION_TIERS,
	TABLES,
	TABLE_CREDIT_TRANSACTIONS,
	TABLE_USER_CREDITS,
	TABLE_USER_SUBSCRIPTIONS,
	TRANSACTION_TYPES,
	type CreditTransactionInsert,
	type SubscriptionTier as SubscriptionTierType,
	type UserCreditsInsert,
	type UserCreditsUpdate,
	type UserSubscriptionInsert,
} from "@/lib/database.constants";
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
				.from(TABLES.USER_SUBSCRIPTIONS)
				.select("*")
				.eq(TABLE_USER_SUBSCRIPTIONS.USER_ID, user.id)
				.single();

			if (error) {
				// If no record exists, create one with free tier
				if (error.code === "PGRST116") {
					const insertData: UserSubscriptionInsert = {
						[TABLE_USER_SUBSCRIPTIONS.USER_ID]: user.id,
						[TABLE_USER_SUBSCRIPTIONS.TIER]: SUBSCRIPTION_TIERS.FREE,
						[TABLE_USER_SUBSCRIPTIONS.STRIPE_CUSTOMER_ID]: null,
						[TABLE_USER_SUBSCRIPTIONS.STRIPE_SUBSCRIPTION_ID]: null,
						[TABLE_USER_SUBSCRIPTIONS.CURRENT_PERIOD_START]: null,
						[TABLE_USER_SUBSCRIPTIONS.CURRENT_PERIOD_END]: null,
						[TABLE_USER_SUBSCRIPTIONS.CANCEL_AT_PERIOD_END]: false,
					};
					const { data: newSub, error: insertError } = await supabase
						.from(TABLES.USER_SUBSCRIPTIONS)
						.insert(insertData)
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
				.from(TABLES.USER_CREDITS)
				.select("*")
				.eq(TABLE_USER_CREDITS.USER_ID, user.id)
				.single();

			if (error) {
				// If no record exists, create one with free tier default (30 credits)
				if (error.code === "PGRST116") {
					const insertData: UserCreditsInsert = {
						[TABLE_USER_CREDITS.USER_ID]: user.id,
						[TABLE_USER_CREDITS.CREDITS]: 30,
						[TABLE_USER_CREDITS.MONTHLY_CREDITS_REMAINING]: 30,
					};
					const { data: newCredits, error: insertError } = await supabase
						.from(TABLES.USER_CREDITS)
						.insert(insertData)
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
				.from(TABLES.CREDIT_TRANSACTIONS)
				.select("*")
				.eq(TABLE_CREDIT_TRANSACTIONS.USER_ID, user.id)
				.order(TABLE_CREDIT_TRANSACTIONS.CREATED_AT, { ascending: false })
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
				.from(TABLES.USER_CREDITS)
				.select(TABLE_USER_CREDITS.CREDITS)
				.eq(TABLE_USER_CREDITS.USER_ID, user.id)
				.single();

			if (fetchError) throw fetchError;
			if (currentCredits[TABLE_USER_CREDITS.CREDITS] < amount) {
				throw new Error("Insufficient credits");
			}

			// Deduct credits
			const updateData: UserCreditsUpdate = {
				[TABLE_USER_CREDITS.CREDITS]: currentCredits[TABLE_USER_CREDITS.CREDITS] - amount,
			};
			const { error: updateError } = await supabase
				.from(TABLES.USER_CREDITS)
				.update(updateData)
				.eq(TABLE_USER_CREDITS.USER_ID, user.id);

			if (updateError) throw updateError;

			// Log transaction
			const transaction: CreditTransactionInsert = {
				[TABLE_CREDIT_TRANSACTIONS.USER_ID]: user.id,
				[TABLE_CREDIT_TRANSACTIONS.AMOUNT]: -amount,
				[TABLE_CREDIT_TRANSACTIONS.TRANSACTION_TYPE]: TRANSACTION_TYPES.USAGE,
				[TABLE_CREDIT_TRANSACTIONS.TRANSACTION_DESCRIPTION]: description,
			};
			const { error: transactionError } = await supabase
				.from(TABLES.CREDIT_TRANSACTIONS)
				.insert(transaction);

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
				.from(TABLES.USER_CREDITS)
				.select(TABLE_USER_CREDITS.CREDITS)
				.eq(TABLE_USER_CREDITS.USER_ID, user.id)
				.single();

			if (fetchError) throw fetchError;

			// Add credits
			const updateData: UserCreditsUpdate = {
				[TABLE_USER_CREDITS.CREDITS]: currentCredits[TABLE_USER_CREDITS.CREDITS] + amount,
			};
			const { error: updateError } = await supabase
				.from(TABLES.USER_CREDITS)
				.update(updateData)
				.eq(TABLE_USER_CREDITS.USER_ID, user.id);

			if (updateError) throw updateError;

			// Log transaction
			const transaction: CreditTransactionInsert = {
				[TABLE_CREDIT_TRANSACTIONS.USER_ID]: user.id,
				[TABLE_CREDIT_TRANSACTIONS.AMOUNT]: amount,
				[TABLE_CREDIT_TRANSACTIONS.TRANSACTION_TYPE]: transactionType as typeof TRANSACTION_TYPES[keyof typeof TRANSACTION_TYPES],
				[TABLE_CREDIT_TRANSACTIONS.TRANSACTION_DESCRIPTION]: description,
			};
			const { error: transactionError } = await supabase
				.from(TABLES.CREDIT_TRANSACTIONS)
				.insert(transaction);

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
