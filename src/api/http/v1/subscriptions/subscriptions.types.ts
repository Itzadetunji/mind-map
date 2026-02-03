export interface GetSubscriptionPayload {
	subscriptionId: string;
}

export interface GetSubscriptionResponse {
	subscriptionId: string | null;
	customerId: string | null;
	status: string | null;
	currentPeriodStart: string | null;
	currentPeriodEnd: string | null;
	cancelAtPeriodEnd: boolean;
	productId: string | null;
}

export interface CancelSubscriptionPayload {
	subscriptionId: string;
}

export interface CancelSubscriptionResponse {
	subscriptionId: string | null;
	status: string | null;
	currentPeriodEnd: string | null;
	cancelAtPeriodEnd: boolean;
}
