import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import type {
	SubscriptionTierType,
	UserCredits,
	UserSubscription,
} from "@/lib/database.types";
import { supabase } from "@/lib/supabase";
import type { Database } from "@/lib/supabase-database.types";
import { cancelSubscription } from "@/server/functions/subscriptions/cancel";
import { getSubscription } from "@/server/functions/subscriptions/get";
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

	return useQuery({
		queryKey: creditsQueryKeys.dodoStatus(user?.id),
		queryFn: async () => {
			if (!subscriptionId) return null;
			return getSubscription({ data: { subscriptionId } });
		},
		enabled:
			(options?.enabled ?? true) &&
			!!user &&
			!!subscriptionId &&
			!userSubscriptionQuery.isLoading,
		refetchInterval: options?.refetchInterval ?? false,
	});
}

export const useCancelDodoSubscription = () => {
	const user = useAuthStore((state) => state.user);
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async ({ subscriptionId }: { subscriptionId: string }) => {
			if (!user) throw new Error("User not authenticated");

			const result = await cancelSubscription({ data: { subscriptionId } });

			const updateData: Database["public"]["Tables"]["user_subscriptions"]["Update"] =
				{
					cancel_at_period_end: !!result.cancelAtPeriodEnd,
					current_period_end: result.currentPeriodEnd,
				};

			const { error } = await supabase
				.from("user_subscriptions")
				.update(updateData as never)
				.eq("user_id", user.id);

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
};

export const getTierMonthlyCredits = (
	tier: SubscriptionTierType | null,
): number => {
	switch (tier) {
		case "hobby":
			return 150;
		case "pro":
			return 150;
		default:
			return 0;
	}
};

export const getTierPrice = (tier: SubscriptionTierType | null): number => {
	switch (tier) {
		case "hobby":
			return 9.99;
		case "pro":
			return 24.99;
		default:
			return 0;
	}
};

export const getTierTopUpBonus = (
	tier: SubscriptionTierType | null,
): number => {
	switch (tier) {
		case "pro":
			return 0.2;
		default:
			return 0;
	}
};

export const getTierInitialCredits = (
	tier: SubscriptionTierType | null,
): number => {
	switch (tier) {
		case "hobby":
			return 35;
		case "pro":
			return 70;
		default:
			return 0;
	}
};

export const useUserSubscription = () => {
	const user = useAuthStore((state) => state.user);

	return useQuery({
		queryKey: creditsQueryKeys.subscription(user?.id),
		queryFn: async () => {
			if (!user) return null;

			const { data, error } = await supabase
				.from("user_subscriptions")
				.select("*")
				.eq("user_id", user.id)
				.single();

			if (error) {
				if (error.code === "PGRST116") return null;
				throw error;
			}
			return data as UserSubscription;
		},
		enabled: !!user,
	});
};

export const useUserCredits = () => {
	const user = useAuthStore((state) => state.user);

	return useQuery({
		queryKey: creditsQueryKeys.balance(user?.id),
		queryFn: async () => {
			if (!user) return null;

			const { data, error } = await supabase
				.from("user_credits")
				.select("*")
				.eq("user_id", user.id)
				.single();

			if (error) {
				if (error.code === "PGRST116") return null;
				throw error;
			}
			return data as UserCredits;
		},
		enabled: !!user,
	});
};

export const useDeductCredits = () => {
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

			const {
				data: currentCreditsRaw,
				error: fetchError,
			} = await supabase
				.from("user_credits")
				.select("credits")
				.eq("user_id", user.id)
				.single();

			if (fetchError) throw fetchError;
			const currentCredits = currentCreditsRaw as { credits: number } | null;
			if (!currentCredits || currentCredits.credits < amount) {
				throw new Error("Insufficient credits");
			}

			const updateData: Database["public"]["Tables"]["user_credits"]["Update"] =
				{
					credits: currentCredits.credits - amount,
				};
			const { error: updateError } = await supabase
				.from("user_credits")
				.update(updateData as never)
				.eq("user_id", user.id);

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
};

export const useAddCredits = () => {
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

			const {
				data: currentCreditsRaw,
				error: fetchError,
			} = await supabase
				.from("user_credits")
				.select("credits")
				.eq("user_id", user.id)
				.single();

			if (fetchError) throw fetchError;

			const currentCredits = currentCreditsRaw as { credits: number } | null;
			if (!currentCredits) {
				throw new Error("Unable to fetch current credits");
			}

			const updateData: Database["public"]["Tables"]["user_credits"]["Update"] =
				{
					credits: currentCredits.credits + amount,
				};
			const { error: updateError } = await supabase
				.from("user_credits")
				.update(updateData as never)
				.eq("user_id", user.id);

			if (updateError) throw updateError;

			return { success: true };
		},
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: creditsQueryKeys.balance(user?.id),
			});
		},
	});
};

export const useDailyCreditsCheck = () => {
	const user = useAuthStore((state) => state.user);
	const queryClient = useQueryClient();

	return useQuery({
		queryKey: creditsQueryKeys.dailyCheck(user?.id),
		queryFn: async () => {
			if (!user) return null;

			const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

			const { data, error } = await supabase.rpc(
				"claim_daily_credits",
				{
					p_user_id: user.id,
					p_timezone: userTimezone,
				} as never,
			);

			if (error) {
				console.error("Error checking daily credits:", error);
				return null;
			}

			const response = data as DailyCreditsResponse | null;
			if (response && response.added > 0) {
				queryClient.setQueryData<UserCredits>(
					creditsQueryKeys.balance(user.id),
					(oldData) => {
						if (!oldData) return oldData;
						return {
							...oldData,
							credits: response.new_total,
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
};
