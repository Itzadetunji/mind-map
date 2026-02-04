import { createFileRoute } from "@tanstack/react-router";
import DodoPayments from "dodopayments";
import { StatusCodes } from "http-status-codes";

import {
	TABLE_USER_SUBSCRIPTIONS,
	TABLES,
} from "@/lib/constants/database.constants";
import {
	SubscriptionTier,
	type SubscriptionTierType,
} from "@/lib/database.types";
import { getSupabaseAdminClient } from "../../../../supabase/index";
import {
	apiErrorResponse,
	apiResponse,
	getUserByEmail,
} from "../../api/v1/utils";

void createFileRoute;

export interface DodoWebhookBillingAddress {
	country: string;
	city: string;
	state: string;
	street: string;
	zipcode: string;
}

export interface DodoWebhookCustomer {
	customer_id: string;
	email: string;
	name: string;
	metadata: Record<string, unknown>;
	phone_number: string;
}

export interface DodoWebhookDispute {
	amount: string;
	business_id: string;
	created_at: string;
	currency: string;
	dispute_id: string;
	dispute_stage:
		| "pre_dispute"
		| "chargeback"
		| "chargeback_pre_arbitration"
		| "chargeback_arbitration"
		| string;
	dispute_status:
		| "dispute_opened"
		| "dispute_won"
		| "dispute_lost"
		| "dispute_challenged"
		| "dispute_cancelled"
		| "dispute_expired"
		| string;
	payment_id: string;
	remarks: string;
}

export interface DodoWebhookRefund {
	business_id: string;
	created_at: string;
	is_partial: boolean;
	payment_id: string;
	refund_id: string;
	status: "succeeded" | "failed" | "pending" | string;
	amount: number;
	currency: string;
	reason: string;
}

export interface DodoWebhookCustomFieldResponse {
	key: string;
	value: string;
}

export type DodoSubscriptionStatus =
	| "subscription.active"
	| "subscription.cancelled"
	| "subscription.expired"
	| "subscription.failed"
	| "subscription.on_hold"
	| "subscription.plan_changed"
	| "subscription.renewed"
	| "subscription.updated";

export interface DodoWebhookSubscriptionData {
	addons: unknown[];
	billing: DodoWebhookBillingAddress;
	cancel_at_next_billing_date: boolean;
	cancelled_at: string | null;
	created_at: string;
	currency: string;
	custom_field_responses: DodoWebhookCustomFieldResponse[] | null;
	customer: DodoWebhookCustomer;
	discount_cycles_remaining: number | null;
	discount_id: string | null;
	expires_at: string | null;
	metadata: Record<string, unknown>;
	meters: unknown[];
	next_billing_date: string | null;
	on_demand: boolean;
	payload_type: "Subscription" | string;
	payment_frequency_count: number;
	payment_frequency_interval: string;
	payment_method_id: string | null;
	previous_billing_date: string | null;
	product_id: string;
	quantity: number;
	recurring_pre_tax_amount: number;
	status: "active" | string;
	subscription_id: string;
	subscription_period_count: number;
	subscription_period_interval: string;
	tax_id: string | null;
	tax_inclusive: boolean;
	trial_period_days: number | null;
}

export interface DodoWebhookPaymentIntentPayload {
	business_id: string;
	data: DodoWebhookSubscriptionData;
	timestamp: string;
	type: DodoSubscriptionStatus;
}

const resolveTierForEvent = (
	type: DodoSubscriptionStatus,
	tierFromProduct: SubscriptionTierType | null,
): SubscriptionTierType => {
	switch (type) {
		case "subscription.active":
		case "subscription.renewed":
		case "subscription.plan_changed":
		case "subscription.updated":
			return tierFromProduct ?? SubscriptionTier.FREE;
		default:
			return SubscriptionTier.FREE;
	}
};

const resolveCancelAtPeriodEnd = (
	type: DodoSubscriptionStatus,
	subscription: { cancel_at_next_billing_date?: boolean | null },
	data: DodoWebhookSubscriptionData,
): boolean => {
	switch (type) {
		case "subscription.cancelled":
		case "subscription.expired":
		case "subscription.failed":
			return true;
		case "subscription.on_hold":
			// Respect Dodo's own flag for on-hold subscriptions
			return (
				subscription.cancel_at_next_billing_date ??
				data.cancel_at_next_billing_date ??
				false
			);
		default:
			return (
				subscription.cancel_at_next_billing_date ??
				data.cancel_at_next_billing_date ??
				false
			);
	}
};

const upsertUserSubscription = async (args: {
	supabase: ReturnType<typeof getSupabaseAdminClient>;
	userId: string;
	tierToSave: SubscriptionTierType;
	payload: DodoWebhookPaymentIntentPayload;
	subscription: {
		next_billing_date: string | null;
		cancel_at_next_billing_date?: boolean | null;
	};
}) => {
	const { supabase, userId, tierToSave, payload, subscription } = args;

	const upsertData = {
		[TABLE_USER_SUBSCRIPTIONS.USER_ID]: userId,
		[TABLE_USER_SUBSCRIPTIONS.TIER]: tierToSave,
		[TABLE_USER_SUBSCRIPTIONS.DODO_CUSTOMER_ID]:
			payload.data.customer.customer_id,
		[TABLE_USER_SUBSCRIPTIONS.DODO_SUBSCRIPTION_ID]:
			payload.data.subscription_id,
		[TABLE_USER_SUBSCRIPTIONS.CURRENT_PERIOD_START]: new Date().toISOString(),
		[TABLE_USER_SUBSCRIPTIONS.CURRENT_PERIOD_END]:
			subscription.next_billing_date,
		[TABLE_USER_SUBSCRIPTIONS.CANCEL_AT_PERIOD_END]: resolveCancelAtPeriodEnd(
			payload.type,
			subscription,
			payload.data,
		),
	};

	const { error: upsertError } = await supabase
		.from(TABLES.USER_SUBSCRIPTIONS)
		.upsert(upsertData, {
			onConflict: TABLE_USER_SUBSCRIPTIONS.USER_ID,
		});

	if (upsertError) {
		throw upsertError;
	}
};

const getDodoClient = () => {
	const bearerToken = process.env.DODO_PAYMENTS_API_KEY;

	if (!bearerToken) {
		throw new Error("Missing DODO_PAYMENTS_API_KEY environment variable");
	}

	const environment = (process.env.DODO_PAYMENTS_ENVIRONMENT || "live_mode") as
		| "test_mode"
		| "live_mode";

	return new DodoPayments({ bearerToken, environment });
};

const resolveTierFromProductId = (productId: string | null) => {
	if (!productId) return null;

	const isTest =
		(process.env.DODO_PAYMENTS_ENVIRONMENT || "live_mode") === "test_mode" ||
		process.env.NODE_ENV === "development";

	const hobbyProductId = isTest
		? process.env.TEST_DODO_PAYMENTS_HOBBY_PRODUCT_ID
		: process.env.DODO_PAYMENTS_HOBBY_PRODUCT_ID;
	const proProductId = isTest
		? process.env.TEST_DODO_PAYMENTS_PRO_PRODUCT_ID
		: process.env.DODO_PAYMENTS_PRO_PRODUCT_ID;

	if (productId === hobbyProductId) return SubscriptionTier.HOBBY;
	if (productId === proProductId) return SubscriptionTier.PRO;

	return null;
};

export const Route = createFileRoute("/v1/dodo/subscription-webhook")({
	server: {
		handlers: {
			POST: async ({ request }) => {
				const rawBody = await request.text();
				const webhookSecret = process.env.DODO_WEBHOOK_SECRET;

				if (!webhookSecret) {
					return apiErrorResponse(
						StatusCodes.UNAUTHORIZED,
						"Invalid signature",
					);
				}

				let payload: DodoWebhookPaymentIntentPayload;
				try {
					payload = JSON.parse(rawBody) as DodoWebhookPaymentIntentPayload;
				} catch {
					return apiErrorResponse(StatusCodes.BAD_REQUEST, "Invalid JSON");
				}

				if (!payload.data.subscription_id) {
					return apiResponse(
						{ received: true, reason: "no-subscription-id" },
						"No subscription id",
					);
				}

				const customerEmail = payload.data.customer?.email;

				if (!customerEmail) {
					return apiResponse(
						{ received: true, reason: "no-customer-email" },
						"No customer email",
					);
				}

				const supabase = getSupabaseAdminClient();

				// Prefer an explicit user_id stored in the subscription metadata,

				let userId =
					(payload.data.metadata as { user_id?: string })?.user_id ?? null;

				if (!userId) {
					const { user, error } = await getUserByEmail(customerEmail);

					console.log("User lookup via email:", user?.id, "Error:", error);

					if (error || !user?.id) {
						return apiResponse(
							{ received: true, reason: "user-not-found" },
							"User not found",
						);
					}

					userId = user.id;
				}

				const tierFromProduct = resolveTierFromProductId(
					payload.data.product_id,
				);
				const tierToSave = resolveTierForEvent(payload.type, tierFromProduct);

				const dodoClient = getDodoClient();
				const subscription = await dodoClient.subscriptions.retrieve(
					payload.data.subscription_id,
				);

				try {
					await upsertUserSubscription({
						supabase,
						userId: userId as string,
						tierToSave,
						payload,
						subscription,
					});
				} catch (upsertError) {
					return apiErrorResponse(
						StatusCodes.INTERNAL_SERVER_ERROR,
						upsertError instanceof Error
							? upsertError.message
							: "Failed to update subscription",
					);
				}
				return apiResponse({ received: true }, "Webhook processed");
			},
		},
	},
});
