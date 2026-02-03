import { createServerFn } from "@tanstack/react-start";
import DodoPayments from "dodopayments";
import { z } from "zod";

const getDodoSubscriptionSchema = z.object({
	subscriptionId: z.string().min(1),
});

export const getDodoSubscriptionDetails = createServerFn({ method: "POST" })
	.inputValidator(getDodoSubscriptionSchema)
	.handler(async ({ data }) => {
		const bearerToken = process.env.DODO_PAYMENTS_API_KEY;

		if (!bearerToken) {
			throw new Error("Missing DODO_PAYMENTS_API_KEY environment variable");
		}

		const environment = (process.env.DODO_PAYMENTS_ENVIRONMENT ||
			"live_mode") as "test_mode" | "live_mode";
		const client = new DodoPayments({ bearerToken, environment });

		const subscription = await client.subscriptions.retrieve(
			data.subscriptionId,
		);

		return {
			subscriptionId: subscription.subscription_id ?? data.subscriptionId,
			customerId: subscription.customer?.customer_id ?? null,
			status: subscription.status ?? null,
			currentPeriodStart: subscription.previous_billing_date ?? null,
			currentPeriodEnd: subscription.next_billing_date ?? null,
			cancelAtPeriodEnd: subscription.cancel_at_next_billing_date ?? false,
			productId: subscription.product_id ?? null,
		};
	});
