import { createAPIFileRoute } from "@tanstack/start/api";
import DodoPayments from "dodopayments";
import { z } from "zod";
import {
	SubscriptionTier,
	type SubscriptionTierType,
} from "@/lib/database.types";
import { apiErrorResponse, StatusCodes } from "../utils";

const productTierSchema = z.enum([
	SubscriptionTier.HOBBY,
	SubscriptionTier.PRO,
]);
const createCheckoutSchema = z.object({
	tier: productTierSchema,
	email: z.string().email(),
	name: z.string().min(1),
});

const getProductIdForTier = (tier: SubscriptionTierType) =>
	process.env.NODE_ENV === "development"
		? tier === SubscriptionTier.HOBBY
			? process.env.TEST_DODO_PAYMENTS_HOBBY_PRODUCT_ID
			: process.env.TEST_DODO_PAYMENTS_PRO_PRODUCT_ID
		: tier === SubscriptionTier.HOBBY
			? process.env.DODO_PAYMENTS_HOBBY_PRODUCT_ID
			: process.env.DODO_PAYMENTS_PRO_PRODUCT_ID;

export const APIRoute = createAPIFileRoute("/api/v1/checkout/create")({
	POST: async ({ request }) => {
		const body = await request.json();
		const parsed = createCheckoutSchema.safeParse(body);
		if (!parsed.success) {
			const errors = parsed.error.issues.map((i) => i.message);
			return apiErrorResponse(
				StatusCodes.BAD_REQUEST,
				errors[0] ?? "Validation failed",
				errors,
			);
		}
		const data = parsed.data;
		const bearerToken = process.env.DODO_PAYMENTS_API_KEY;
		if (!bearerToken) {
			return apiErrorResponse(
				StatusCodes.INTERNAL_SERVER_ERROR,
				"Missing DODO_PAYMENTS_API_KEY environment variable",
			);
		}
		const productId = getProductIdForTier(data.tier);
		if (!productId) {
			return apiErrorResponse(
				StatusCodes.BAD_REQUEST,
				"Missing Dodo product ID for selected tier",
			);
		}
		const environment = (process.env.DODO_PAYMENTS_ENVIRONMENT ||
			"live_mode") as "test_mode" | "live_mode";
		const client = new DodoPayments({ bearerToken, environment });
		const appUrl = process.env.VITE_APP_URL || "http://localhost:7000";
		const returnUrl = `${appUrl}/account?checkout=complete&subscription=${data.tier}`;
		try {
			const session = await client.checkoutSessions.create({
				product_cart: [{ product_id: productId, quantity: 1 }],
				customer: { email: data.email, name: data.name },
				return_url: returnUrl,
			});
			if (!session.checkout_url) {
				return apiErrorResponse(
					StatusCodes.INTERNAL_SERVER_ERROR,
					"Dodo checkout URL was not returned",
				);
			}
			return Response.json({
				checkoutUrl: session.checkout_url,
				sessionId: session.session_id,
			});
		} catch (err) {
			return apiErrorResponse(
				StatusCodes.BAD_REQUEST,
				err instanceof Error ? err.message : "Checkout failed",
			);
		}
	},
});
