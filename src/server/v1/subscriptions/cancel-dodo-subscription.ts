import { createServerFn } from "@tanstack/react-start";
import DodoPayments from "dodopayments";
import { z } from "zod";

const cancelDodoSubscriptionSchema = z.object({
	subscriptionId: z.string().min(1),
});

export const cancelDodoSubscription = createServerFn({ method: "POST" })
	.inputValidator(cancelDodoSubscriptionSchema)
	.handler(async ({ data }) => {
		const bearerToken = process.env.DODO_PAYMENTS_API_KEY;

		if (!bearerToken) {
			throw new Error("Missing DODO_PAYMENTS_API_KEY environment variable");
		}

		const environment = (process.env.DODO_PAYMENTS_ENVIRONMENT ||
			"live_mode") as "test_mode" | "live_mode";
		const client = new DodoPayments({ bearerToken, environment });

		const subscription = await client.subscriptions.update(
			data.subscriptionId,
			{
				cancel_at_next_billing_date: true,
			},
		);

		return {
			subscriptionId: subscription.subscription_id ?? data.subscriptionId,
			status: subscription.status ?? null,
			currentPeriodEnd: subscription.next_billing_date ?? null,
			cancelAtPeriodEnd: subscription.cancel_at_next_billing_date ?? true,
		};
	});
