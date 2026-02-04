import { createServerFn } from "@tanstack/react-start";
import DodoPayments from "dodopayments";
import { z } from "zod";
import {
	SubscriptionTier,
	type SubscriptionTierType,
} from "@/lib/database.types";

const productTierSchema = z.enum([
	SubscriptionTier.HOBBY,
	SubscriptionTier.PRO,
]);
const createCheckoutSchema = z.object({
	tier: productTierSchema,
	email: z.string().email(),
	name: z.string().min(1),
	userId: z.string().min(1).optional(),
});

const getProductIdForTier = (tier: SubscriptionTierType) =>
	process.env.NODE_ENV === "development"
		? tier === SubscriptionTier.HOBBY
			? process.env.TEST_DODO_PAYMENTS_HOBBY_PRODUCT_ID
			: process.env.TEST_DODO_PAYMENTS_PRO_PRODUCT_ID
		: tier === SubscriptionTier.HOBBY
			? process.env.DODO_PAYMENTS_HOBBY_PRODUCT_ID
			: process.env.DODO_PAYMENTS_PRO_PRODUCT_ID;

export const createCheckout = createServerFn({ method: "POST" })
	.inputValidator(createCheckoutSchema)
	.handler(async ({ data }) => {
		const bearerToken = process.env.DODO_PAYMENTS_API_KEY;
		if (!bearerToken) {
			throw new Error("Missing DODO_PAYMENTS_API_KEY environment variable");
		}
		const productId = getProductIdForTier(data.tier);
		if (!productId) {
			throw new Error("Missing Dodo product ID for selected tier");
		}
		const environment = (process.env.DODO_PAYMENTS_ENVIRONMENT ||
			"live_mode") as "test_mode" | "live_mode";
		const client = new DodoPayments({ bearerToken, environment });
		const appUrl = process.env.VITE_APP_URL || "http://localhost:7000";
		const returnUrl = `${appUrl}/account?checkout=complete&subscription=${data.tier}`;
		try {
			console.log({
				product_cart: [{ product_id: productId, quantity: 1 }],
				customer: { email: data.email, name: data.name },
				return_url: returnUrl,
				metadata: data.userId ? { user_id: data.userId } : undefined,
			});
			const session = await client.checkoutSessions.create({
				product_cart: [{ product_id: productId, quantity: 1 }],
				customer: { email: data.email, name: data.name },
				return_url: returnUrl,
			});

			if (!session.checkout_url) {
				throw new Error("Dodo checkout URL was not returned");
			}
			return {
				checkoutUrl: session.checkout_url,
				sessionId: session.session_id,
			};
		} catch (err) {
			throw new Error(err instanceof Error ? err.message : "Checkout failed");
		}
	});
