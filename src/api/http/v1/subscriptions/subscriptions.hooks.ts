import { useMutation, useQueryClient } from "@tanstack/react-query";
import { changeSubscriptionPlan } from "@/server/functions/subscriptions/change-plan";
import { creditsQueryKeys } from "../credits/credits.hooks";

export const useChangeSubscriptionPlan = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (data: {
			subscriptionId: string;
			tier: "hobby" | "pro";
			userId: string;
		}) => {
			return await changeSubscriptionPlan({ data });
		},
		onSuccess: (_, variables) => {
			// Invalidate subscription and credits queries to refresh the UI
			queryClient.invalidateQueries({
				queryKey: creditsQueryKeys.subscription(variables.userId),
			});
			queryClient.invalidateQueries({
				queryKey: creditsQueryKeys.balance(variables.userId),
			});
			queryClient.invalidateQueries({
				queryKey: creditsQueryKeys.dodoStatus(variables.userId),
			});
		},
	});
};
