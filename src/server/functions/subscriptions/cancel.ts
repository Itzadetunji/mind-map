import { createServerFn } from "@tanstack/react-start";
import DodoPayments from "dodopayments";
import { z } from "zod";

const cancelSubscriptionSchema = z.object({
	subscriptionId: z.string().min(1),
});

export const cancelSubscription = createServerFn({ method: "POST" })
	.inputValidator(cancelSubscriptionSchema)
	.handler(async ({ data }) => {
		const { subscriptionId } = data;
		const bearerToken = process.env.DODO_PAYMENTS_API_KEY;
		if (!bearerToken) {
			throw new Error("Missing DODO_PAYMENTS_API_KEY environment variable");
		}
		const environment = (process.env.DODO_PAYMENTS_ENVIRONMENT ||
			"live_mode") as "test_mode" | "live_mode";
		const client = new DodoPayments({ bearerToken, environment });
		try {
			const subscription = await client.subscriptions.update(subscriptionId, {
				cancel_at_next_billing_date: true,
			});
			return {
				subscriptionId: subscription.subscription_id ?? subscriptionId,
				status: subscription.status ?? null,
				currentPeriodEnd: subscription.next_billing_date ?? null,
				cancelAtPeriodEnd: subscription.cancel_at_next_billing_date ?? true,
			};
		} catch (err) {
			throw new Error(
				err instanceof Error ? err.message : "Failed to cancel subscription",
			);
		}
	});
