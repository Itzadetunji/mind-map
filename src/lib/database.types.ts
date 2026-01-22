export interface MindMapProject {
	id: string;
	user_id: string;
	title: string;
	description: string | null;
	first_prompt: string;
	graph_data: {
		reasoning?: string;
		nodes: Array<{
			id: string;
			type: string;
			position: { x: number; y: number };
			data: Record<string, unknown>;
		}>;
		edges: Array<{
			id: string;
			source: string;
			target: string;
			label?: string;
		}>;
	};
	created_at: string;
	updated_at: string;
}

export interface ChatMessage {
	id: string;
	mind_map_id: string;
	user_id: string;
	role: "user" | "ai";
	content: string;
	map_data?: any;
	created_at: string;
}

export type SubscriptionTier = "free" | "hobby" | "pro";

export interface UserSubscription {
	id: string;
	user_id: string;
	tier: SubscriptionTier;
	stripe_customer_id: string | null;
	stripe_subscription_id: string | null;
	current_period_start: string | null;
	current_period_end: string | null;
	cancel_at_period_end: boolean;
	created_at: string;
	updated_at: string;
}

export interface UserCredits {
	id: string;
	user_id: string;
	credits: number;
	monthly_credits_remaining: number;
	created_at: string;
	updated_at: string;
}

export interface CreditTransaction {
	id: string;
	user_id: string;
	amount: number;
	transaction_type:
		| "initial"
		| "subscription"
		| "purchase"
		| "usage"
		| "bonus"
		| "refund"
		| "monthly_reset";
	description: string | null;
	created_at: string;
}

export interface ShareLink {
	id: string;
	mind_map_id: string;
	user_id: string;
	share_token: string;
	created_at: string;
	updated_at: string;
}

export interface Database {
	public: {
		Tables: {
			mind_maps: {
				Row: MindMapProject;
				Insert: Omit<MindMapProject, "id" | "created_at" | "updated_at">;
				Update: Partial<Omit<MindMapProject, "id" | "created_at">>;
			};
			chat_messages: {
				Row: ChatMessage;
				Insert: Omit<ChatMessage, "id" | "created_at">;
				Update: Partial<Omit<ChatMessage, "id" | "created_at">>;
			};
			user_subscriptions: {
				Row: UserSubscription;
				Insert: Omit<UserSubscription, "id" | "created_at" | "updated_at">;
				Update: Partial<Omit<UserSubscription, "id" | "created_at">>;
			};
			user_credits: {
				Row: UserCredits;
				Insert: Omit<UserCredits, "id" | "created_at" | "updated_at">;
				Update: Partial<Omit<UserCredits, "id" | "created_at">>;
			};
			credit_transactions: {
				Row: CreditTransaction;
				Insert: Omit<CreditTransaction, "id" | "created_at">;
				Update: Partial<Omit<CreditTransaction, "id" | "created_at">>;
			};
			share_links: {
				Row: ShareLink;
				Insert: Omit<ShareLink, "id" | "created_at" | "updated_at">;
				Update: Partial<Omit<ShareLink, "id" | "created_at" | "updated_at">>;
			};
		};
	};
}
