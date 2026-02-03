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
	map_data?: unknown;
	created_at: string;
}

export const SubscriptionTier = {
	FREE: "free",
	HOBBY: "hobby",
	PRO: "pro",
} as const;

export type SubscriptionTierType =
	(typeof SubscriptionTier)[keyof typeof SubscriptionTier];

export interface UserSubscription {
	id: string;
	user_id: string;
	tier: SubscriptionTierType;
	dodo_customer_id: string | null;
	dodo_subscription_id: string | null;
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
	monthly_credits_used: number;
	last_daily_credit_claimed_at: string | null;
	created_at: string;
	updated_at: string;
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
			share_links: {
				Row: ShareLink;
				Insert: Omit<ShareLink, "id" | "created_at" | "updated_at">;
				Update: Partial<Omit<ShareLink, "id" | "created_at" | "updated_at">>;
			};
		};
	};
}
