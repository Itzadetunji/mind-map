import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
	TABLE_USER_CREDITS,
	TABLE_USER_SUBSCRIPTIONS,
	TABLES,
	type UserCreditsUpdate,
} from "@/lib/constants/database.constants";
import type {
	SubscriptionTierType,
	UserCredits,
	UserSubscription,
} from "@/lib/database.types";
import { supabase } from "@/lib/supabase";
import { cancelDodoSubscription } from "@/server/v1/subscriptions/cancel-dodo-subscription";
import { getDodoSubscriptionDetails } from "@/server/v1/subscriptions/dodo-subscription";
import { useAuthStore } from "@/stores/authStore";

export const creditsQueryKeys = {
	all: ["credits"] as const,
	user: (userId?: string) => [...creditsQueryKeys.all, userId] as const,
	subscription: (userId?: string) =>
		[...creditsQueryKeys.user(userId), "subscription"] as const,
	dodoStatus: (userId?: string) =>
		[...creditsQueryKeys.subscription(userId), "dodo-status"] as const,
	balance: (userId?: string) =>
		[...creditsQueryKeys.user(userId), "balance"] as const,
	transactions: (userId?: string) =>
		[...creditsQueryKeys.user(userId), "transactions"] as const,
	dailyCheck: (userId?: string) =>
		[...creditsQueryKeys.user(userId), "daily-check"] as const,
} as const;

export interface DailyCreditsResponse {
	success: boolean;
	added: number;
	new_total: number;
	days?: number;
	message?: string;
}

export function useDodoSubscriptionStatus(options?: {
	enabled?: boolean;
	refetchInterval?: number | false;
}) {
	const user = useAuthStore((state) => state.user);
	const userSubscriptionQuery = useUserSubscription();
	const subscriptionId = userSubscriptionQuery.data?.dodo_subscription_id;
	console.log(userSubscriptionQuery);
	return useQuery({
		queryKey: creditsQueryKeys.dodoStatus(user?.id),
		queryFn: async () => {
			if (!subscriptionId) return null;
			return getDodoSubscriptionDetails({
				data: { subscriptionId },
			});
		},
		enabled:
			(options?.enabled ?? true) &&
			!!user &&
			!!subscriptionId &&
			!userSubscriptionQuery.isLoading,
		refetchInterval: options?.refetchInterval ?? false,
	});
}

export function useCancelDodoSubscription() {
	const user = useAuthStore((state) => state.user);
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async ({ subscriptionId }: { subscriptionId: string }) => {
			if (!user) throw new Error("User not authenticated");

			const result = await cancelDodoSubscription({
				data: { subscriptionId },
			});

			const { error } = await supabase
				.from(TABLES.USER_SUBSCRIPTIONS)
				.update({
					[TABLE_USER_SUBSCRIPTIONS.CANCEL_AT_PERIOD_END]:
						!!result.cancelAtPeriodEnd,
					[TABLE_USER_SUBSCRIPTIONS.CURRENT_PERIOD_END]:
						result.currentPeriodEnd,
				})
				.eq(TABLE_USER_SUBSCRIPTIONS.USER_ID, user.id);

			if (error) throw error;

			return result;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: creditsQueryKeys.subscription(user?.id),
			});
			queryClient.invalidateQueries({
				queryKey: creditsQueryKeys.dodoStatus(user?.id),
			});
		},
	});
}

// Helper to get monthly credits for a tier
export function getTierMonthlyCredits(
	tier: SubscriptionTierType | null,
): number {
	switch (tier) {
		case "hobby":
			return 150; // Updated to match "up to 150" request
		case "pro":
			return 150;
		default:
			return 0;
	}
}

// Helper to get tier price
export function getTierPrice(tier: SubscriptionTierType | null): number {
	switch (tier) {
		case "hobby":
			return 9.99;
		case "pro":
			return 24.99;
		default:
			return 0;
	}
}

// Helper to get top-up bonus percentage for a tier
export function getTierTopUpBonus(tier: SubscriptionTierType | null): number {
	switch (tier) {
		case "pro":
			return 0.2; // 20% bonus on top-ups
		default:
			return 0;
	}
}

// Helper to get initial credits for a tier (on subscription)
export function getTierInitialCredits(
	tier: SubscriptionTierType | null,
): number {
	switch (tier) {
		case "hobby":
			return 35;
		case "pro":
			return 70;
		default:
			return 0;
	}
}

export function useUserSubscription() {
	const user = useAuthStore((state) => state.user);

	return useQuery({
		queryKey: creditsQueryKeys.subscription(user?.id),
		queryFn: async () => {
			if (!user) return null;

			const { data, error } = await supabase
				.from(TABLES.USER_SUBSCRIPTIONS)
				.select("*")
				.eq(TABLE_USER_SUBSCRIPTIONS.USER_ID, user.id)
				.single();

			if (error) {
				// If no record exists, return null (user has no subscription)
				if (error.code === "PGRST116") {
					return null;
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
		queryKey: creditsQueryKeys.balance(user?.id),
		queryFn: async () => {
			if (!user) return null;

			const { data, error } = await supabase
				.from(TABLES.USER_CREDITS)
				.select("*")
				.eq(TABLE_USER_CREDITS.USER_ID, user.id)
				.single();

			if (error) {
				// If no record exists, return null (credits initialized on subscription)
				if (error.code === "PGRST116") {
					return null;
				}
				throw error;
			}
			return data as UserCredits;
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
			description: _description,
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
				[TABLE_USER_CREDITS.CREDITS]:
					currentCredits[TABLE_USER_CREDITS.CREDITS] - amount,
			};
			const { error: updateError } = await supabase
				.from(TABLES.USER_CREDITS)
				.update(updateData)
				.eq(TABLE_USER_CREDITS.USER_ID, user.id);

			if (updateError) throw updateError;

			return { success: true };
		},
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: creditsQueryKeys.balance(user?.id),
			});
			queryClient.invalidateQueries({
				queryKey: creditsQueryKeys.transactions(user?.id),
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
			transactionType: _transactionType,
			description: _description,
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
				[TABLE_USER_CREDITS.CREDITS]:
					currentCredits[TABLE_USER_CREDITS.CREDITS] + amount,
			};
			const { error: updateError } = await supabase
				.from(TABLES.USER_CREDITS)
				.update(updateData)
				.eq(TABLE_USER_CREDITS.USER_ID, user.id);

			if (updateError) throw updateError;

			return { success: true };
		},
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: creditsQueryKeys.balance(user?.id),
			});
		},
	});
}

export function useDailyCreditsCheck() {
	const user = useAuthStore((state) => state.user);
	const queryClient = useQueryClient();

	return useQuery({
		queryKey: creditsQueryKeys.dailyCheck(user?.id),
		queryFn: async () => {
			if (!user) return null;

			// Get user's timezone
			const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

			const { data, error } = await supabase.rpc("claim_daily_credits", {
				p_user_id: user.id,
				p_timezone: userTimezone,
			});

			if (error) {
				console.error("Error checking daily credits:", error);
				return null;
			}

			const response = data as DailyCreditsResponse | null;
			if (response && response.added > 0) {
				console.log("Daily credits claimed:", response.added);
				// Update credits cache directly with the new total
				queryClient.setQueryData<UserCredits>(
					creditsQueryKeys.balance(user.id),
					(oldData) => {
						if (!oldData) return oldData;
						return {
							...oldData,
							[TABLE_USER_CREDITS.CREDITS]: response.new_total,
						};
					},
				);

				queryClient.invalidateQueries({
					queryKey: creditsQueryKeys.balance(user.id),
				});
			}

			return data;
		},
		enabled: !!user,
		refetchOnWindowFocus: false,
		staleTime: Infinity,
	});
}
