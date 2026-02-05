import { createFileRoute } from "@tanstack/react-router";
import { StatusCodes } from "http-status-codes";

import {
	SubscriptionTier,
	type SubscriptionTierType,
} from "@/lib/database.types";
import type { Database } from "@/lib/supabase-database.types";
import { getSupabaseAdminClient } from "../../../../supabase/index";
import { apiErrorResponse, apiResponse } from "../../../server/utils";

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

export const DodoSubscriptionStatuses = {
	ACTIVE: "subscription.active",
	CANCELLED: "subscription.cancelled",
	EXPIRED: "subscription.expired",
	FAILED: "subscription.failed",
	ON_HOLD: "subscription.on_hold",
	PLAN_CHANGED: "subscription.plan_changed",
	RENEWED: "subscription.renewed",
	UPDATED: "subscription.updated",
} as const;

export type DodoSubscriptionStatus =
	(typeof DodoSubscriptionStatuses)[keyof typeof DodoSubscriptionStatuses];

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
	metadata: { user_id: string };
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
	status: DodoSubscriptionStatus;
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
	tierFromProduct: SubscriptionTierType,
): SubscriptionTierType => {
	switch (type) {
		case DodoSubscriptionStatuses.ACTIVE:
		case DodoSubscriptionStatuses.RENEWED:
		case DodoSubscriptionStatuses.PLAN_CHANGED:
		case DodoSubscriptionStatuses.UPDATED:
			return tierFromProduct;
		default:
			return SubscriptionTier.FREE;
	}
};

const resolveCancelAtPeriodEnd = (
	type: DodoSubscriptionStatus,
	subscription: {
		cancel_at_next_billing_date: boolean;
		cancelled_at?: string | null;
	},
): boolean => {
	switch (type) {
		case DodoSubscriptionStatuses.CANCELLED:
		case DodoSubscriptionStatuses.EXPIRED:
		case DodoSubscriptionStatuses.FAILED:
			return true;
		case DodoSubscriptionStatuses.ON_HOLD:
			// Respect Dodo's own flag for on-hold subscriptions
			return subscription.cancel_at_next_billing_date;
		default:
			return subscription.cancel_at_next_billing_date;
	}
};

const upsertUserSubscription = async (args: {
	supabase: ReturnType<typeof getSupabaseAdminClient>;
	userId: string;
	tierToSave: SubscriptionTierType;
	payload: DodoWebhookPaymentIntentPayload;
}) => {
	const { supabase, userId, tierToSave, payload } = args;
	const subscription = {
		next_billing_date: payload.data.next_billing_date,
		cancel_at_next_billing_date: payload.data.cancel_at_next_billing_date,
		cancelled_at: payload.data.cancelled_at,
	};

	const upsertData: Database["public"]["Tables"]["user_subscriptions"]["Insert"] =
		{
			user_id: userId,
			tier: tierToSave,
			dodo_customer_id: payload.data.customer.customer_id,
			dodo_subscription_id: payload.data.subscription_id,
			current_period_start: payload.data.created_at,
			current_period_end: subscription.next_billing_date ?? null,
			cancel_at_period_end: resolveCancelAtPeriodEnd(
				payload.type,
				subscription,
			),
			cancelled_at: subscription.cancelled_at,
		};

	// Service role client bypasses RLS; if no error but 0 rows, RLS or conflict target may be wrong
	const { data: upserted, error: upsertError } = await supabase
		.from("user_subscriptions")
		.upsert(upsertData, {
			onConflict: "user_id",
			ignoreDuplicates: false,
		})
		.select("user_id")
		.single();

	if (upsertError) {
		throw upsertError;
	}
	if (!upserted) {
		throw new Error(
			"Subscription upsert returned no row (check RLS and onConflict target)",
		);
	}
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

const resolveTierFromAdvertisingProductId = (productId: string | null) => {
	if (!productId) return null;

	const isTest =
		(process.env.DODO_PAYMENTS_ENVIRONMENT || "live_mode") === "test_mode" ||
		process.env.NODE_ENV === "development";

	const advertisingProductId = isTest
		? process.env.TEST_DODO_PAYMENTS_ADVERTISING_PRODUCT_ID
		: process.env.DODO_PAYMENTS_ADVERTISING_PRODUCT_ID;

	if (productId === advertisingProductId) return true;

	return false;
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
					return apiErrorResponse(
						StatusCodes.BAD_REQUEST,
						"No subscription id",
					);
				}

				const tierFromProduct = resolveTierFromProductId(
					payload.data.product_id,
				);

				if (resolveTierFromAdvertisingProductId(payload.data.product_id)) {
					return apiResponse({ success: true }, "Advertisement processed");
				}

				const customerEmail = payload.data.customer?.email;

				if (!customerEmail) {
					return apiErrorResponse(StatusCodes.BAD_REQUEST, "No customer email");
				}

				const supabase = getSupabaseAdminClient();

				const userId = payload.data.metadata.user_id;

				if (!userId) {
					return apiErrorResponse(
						StatusCodes.BAD_REQUEST,
						"No user id in metadata",
					);
				}

				const tierToSave = resolveTierForEvent(
					payload.type,
					tierFromProduct as SubscriptionTierType,
				);

				try {
					await upsertUserSubscription({
						supabase,
						userId: userId as string,
						tierToSave,
						payload,
					});
				} catch (upsertError) {
					return apiErrorResponse(
						StatusCodes.INTERNAL_SERVER_ERROR,
						upsertError instanceof Error
							? upsertError.message
							: "Failed to update subscription",
					);
				}
				return apiResponse({ success: true }, "Webhook processed");
			},
		},
	},
});
