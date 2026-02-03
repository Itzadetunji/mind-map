import crypto from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { createFileRoute } from "@tanstack/react-router";
import { createAPIFileRoute } from "@tanstack/start-api-routes";
import DodoPayments from "dodopayments";
import { StatusCodes } from "http-status-codes";

import {
	TABLE_USER_SUBSCRIPTIONS,
	TABLES,
} from "@/lib/constants/database.constants";
import { SubscriptionTier } from "@/lib/database.types";

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

export interface DodoWebhookProductCartItem {
	product_id: string;
	quantity: number;
}

export interface DodoWebhookPaymentIntentPayload {
	billing: DodoWebhookBillingAddress;
	brand_id: string;
	business_id: string;
	created_at: string;
	currency: string;
	customer: DodoWebhookCustomer;
	digital_products_delivered: boolean;
	disputes: DodoWebhookDispute[];
	metadata: Record<string, unknown>;
	payment_id: string;
	refunds: DodoWebhookRefund[];
	settlement_amount: number;
	settlement_currency: string;
	total_amount: number;
	card_holder_name: string;
	card_issuing_country: string;
	card_last_four: string;
	card_network: string;
	card_type: string;
	checkout_session_id: string;
	custom_field_responses: DodoWebhookCustomFieldResponse[];
	discount_id: string;
	error_code: string;
	error_message: string;
	invoice_id: string;
	invoice_url: string;
	payment_link: string;
	payment_method: string;
	payment_method_type: string;
	product_cart: DodoWebhookProductCartItem[];
	settlement_tax: number;
	status:
		| "succeeded"
		| "failed"
		| "cancelled"
		| "processing"
		| "requires_customer_action"
		| "requires_merchant_action"
		| "requires_payment_method"
		| "requires_confirmation"
		| "requires_capture"
		| "partially_captured"
		| "partially_captured_and_capturable"
		| string;
	subscription_id: string;
	tax: number;
	updated_at: string;
}

const getSupabaseAdminClient = () => {
	const supabaseUrl = process.env.VITE_SUPABASE_URL || "";
	const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

	if (!supabaseUrl || !serviceRoleKey) {
		throw new Error(
			"Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables",
		);
	}

	return createClient(supabaseUrl, serviceRoleKey);
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

const verifySignature = (
	rawBody: string,
	signature: string,
	secret: string,
) => {
	const trimmedSignature = signature.replace(/^sha256=/, "");
	const digest = crypto
		.createHmac("sha256", secret)
		.update(rawBody, "utf8")
		.digest("hex");

	const signatureBuffer = Buffer.from(trimmedSignature);
	const digestBuffer = Buffer.from(digest);

	if (signatureBuffer.length !== digestBuffer.length) {
		return false;
	}

	return crypto.timingSafeEqual(signatureBuffer, digestBuffer);
};

export const Route = createAPIFileRoute("/api/dodo-webhook")({
	POST: async ({ request }) => {
		const rawBody = await request.text();
		const webhookSecret = process.env.DODO_WEBHOOK_SECRET;

		if (webhookSecret) {
			const signatureHeader =
				request.headers.get("x-dodo-signature") ||
				request.headers.get("dodo-signature") ||
				request.headers.get("x-webhook-signature");

			if (!signatureHeader) {
				return new Response("Missing signature", { status: 401 });
			}

			if (!verifySignature(rawBody, signatureHeader, webhookSecret)) {
				return new Response("Invalid signature", { status: 401 });
			}
		}

		let payload: DodoWebhookPaymentIntentPayload;
		console.log("Received Dodo webhook:", rawBody);
		try {
			payload = JSON.parse(rawBody) as DodoWebhookPaymentIntentPayload;
		} catch {
			return new Response("Invalid JSON", { status: 400 });
		}

		if (!payload.subscription_id) {
			return new Response(
				JSON.stringify({ received: true, reason: "no-subscription-id" }),
				{
					status: 200,
					headers: { "content-type": "application/json" },
				},
			);
		}

		const customerEmail = payload.customer?.email;
		null;

		if (!customerEmail) {
			return new Response(
				JSON.stringify({ received: true, reason: "no-customer-email" }),
				{
					status: 200,
					headers: { "content-type": "application/json" },
				},
			);
		}

		const supabase = getSupabaseAdminClient();
		const { data: userData, error: userError } = await supabase
			.schema("auth")
			.from("users")
			.select("id, email")
			.eq("email", customerEmail)
			.maybeSingle();

		if (userError || !userData?.id) {
			return new Response(
				JSON.stringify({ received: true, reason: "user-not-found" }),
				{
					status: 200,
					headers: { "content-type": "application/json" },
				},
			);
		}

		const tierFromProduct = resolveTierFromProductId(
			payload.product_cart[0].product_id ?? null,
		);
		const status = payload.status;
		const isActive = status === "succeeded";
		const tierToSave =
			isActive && tierFromProduct ? tierFromProduct : SubscriptionTier.FREE;

		const dodoClient = getDodoClient();
		const subscription = await dodoClient.subscriptions.retrieve(
			payload.subscription_id as string,
		);

		const upsertData = {
			[TABLE_USER_SUBSCRIPTIONS.USER_ID]: userData.id,
			[TABLE_USER_SUBSCRIPTIONS.TIER]: tierToSave,
			[TABLE_USER_SUBSCRIPTIONS.DODO_CUSTOMER_ID]: payload.customer.customer_id,
			[TABLE_USER_SUBSCRIPTIONS.DODO_SUBSCRIPTION_ID]: payload.subscription_id,
			[TABLE_USER_SUBSCRIPTIONS.CURRENT_PERIOD_START]: new Date().toISOString(),
			[TABLE_USER_SUBSCRIPTIONS.CURRENT_PERIOD_END]:
				subscription.next_billing_date,
			[TABLE_USER_SUBSCRIPTIONS.CANCEL_AT_PERIOD_END]:
				subscription.cancel_at_next_billing_date ?? false,
		};

		const { error: upsertError } = await supabase
			.from(TABLES.USER_SUBSCRIPTIONS)
			.upsert(upsertData, {
				onConflict: TABLE_USER_SUBSCRIPTIONS.USER_ID,
			});

		if (upsertError) {
			return new Response(
				JSON.stringify({ received: false, error: upsertError.message }),
				{
					status: StatusCodes.INTERNAL_SERVER_ERROR,
					headers: { "content-type": "application/json" },
				},
			);
		}

		return new Response(JSON.stringify({ received: true }), {
			status: StatusCodes.OK,
			headers: { "content-type": "application/json" },
		});
	},
});
