import type { SubscriptionTierType } from "@/lib/database.types";

export interface CreateCheckoutPayload {
	tier: SubscriptionTierType;
	email: string;
	name: string;
}

export interface CreateCheckoutResponse {
	checkoutUrl: string;
	sessionId: string;
}
