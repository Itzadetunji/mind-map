import {
	SubscriptionTier,
	type SubscriptionTierType,
} from "@/lib/database.types";
import {
	DodoSubscriptionDataStatuses,
	DodoSubscriptionStatuses,
	type DodoWebhookPaymentIntentPayload,
} from "@/routes/v1/dodo/subscription-webhook";
import { getResendClient } from "@/server/functions/emails/resend";
import { subscriptionReceiptTemplate } from "@/server/functions/emails/templates/subscriptionReceipt";

export interface SendSubscriptionReceiptArgs {
	customerEmail: string;
	customerName?: string | null;
	tierToSave: SubscriptionTierType;
	payload: DodoWebhookPaymentIntentPayload;
}

const resolveIntervalLabel = (payload: DodoWebhookPaymentIntentPayload) => {
	const count = payload.data.subscription_period_count || 1;
	const interval = payload.data.subscription_period_interval || "month";
	const label = count === 1 ? interval : `${interval}s`;
	return `Every ${count} ${label}`;
};

const resolvePlanName = (tier: SubscriptionTierType) => {
	switch (tier) {
		case SubscriptionTier.PRO:
			return "Pro";
		case SubscriptionTier.HOBBY:
			return "Hobby";
		default:
			return "Free";
	}
};

const shouldSendReceipt = (payload: DodoWebhookPaymentIntentPayload) => {
	if (payload.data.status !== DodoSubscriptionDataStatuses.ACTIVE) return false;

	return (
		payload.type === DodoSubscriptionStatuses.ACTIVE ||
		payload.type === DodoSubscriptionStatuses.PLAN_CHANGED
	);
};

export const sendSubscriptionReceiptEmail = async (
	args: SendSubscriptionReceiptArgs,
) => {
	const { customerEmail, customerName, tierToSave, payload } = args;

	if (tierToSave === SubscriptionTier.FREE) return;
	if (!shouldSendReceipt(payload)) return;

	const fromAddress = process.env.PROTOMAP_RESEND_FROM_EMAIL;
	if (!fromAddress) {
		throw new Error("Missing PROTOMAP_RESEND_FROM_EMAIL environment variable");
	}

	const resend = getResendClient();
	const planName = resolvePlanName(tierToSave);
	const subject = `${planName} subscription receipt`;

	const html = subscriptionReceiptTemplate({
		name: customerName,
		planName,
		amount: payload.data.recurring_pre_tax_amount,
		currency: payload.data.currency,
		intervalLabel: resolveIntervalLabel(payload),
		startedAt: payload.data.created_at,
		nextBillingDate: payload.data.next_billing_date,
		subscriptionId: payload.data.subscription_id,
	});

	await resend.emails.send({
		from: fromAddress,
		to: customerEmail,
		subject,
		html,
	});
};
