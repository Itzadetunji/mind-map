/**
 * Database Constants
 * Centralized constants for table names, column names, and data types
 * Using "as const" for type safety and autocomplete support
 */

// ════════════════════════════════════════════════════════════════════════════════
// TABLE NAMES
// ════════════════════════════════════════════════════════════════════════════════

export const TABLES = {
	MIND_MAPS: "mind_maps",
	CHAT_MESSAGES: "chat_messages",
	USER_CREDITS: "user_credits",
	USER_SUBSCRIPTIONS: "user_subscriptions",
	CREDIT_TRANSACTIONS: "credit_transactions",
} as const;

// ════════════════════════════════════════════════════════════════════════════════
// STORAGE BUCKETS
// ════════════════════════════════════════════════════════════════════════════════

export const STORAGE_BUCKETS = {
	MIND_MAPS_IMAGES: "mind_maps_images",
} as const;

// ════════════════════════════════════════════════════════════════════════════════
// COMMON COLUMNS (used across multiple tables)
// ════════════════════════════════════════════════════════════════════════════════

export const COMMON = {
	ID: "id",
	USER_ID: "user_id",
	CREATED_AT: "created_at",
	UPDATED_AT: "updated_at",
} as const;

// ════════════════════════════════════════════════════════════════════════════════
// TABLE COLUMNS (organized by table)
// ════════════════════════════════════════════════════════════════════════════════

export const TABLE_MIND_MAPS = {
	...COMMON,
	TITLE: "title",
	DESCRIPTION: "description",
	FIRST_PROMPT: "first_prompt",
	GRAPH_DATA: "graph_data",
} as const;

export const TABLE_CHAT_MESSAGES = {
	...COMMON,
	MIND_MAP_ID: "mind_map_id",
	ROLE: "role",
	CONTENT: "content",
	MAP_DATA: "map_data",
} as const;

export const TABLE_USER_CREDITS = {
	...COMMON,
	CREDITS: "credits",
	MONTHLY_CREDITS_REMAINING: "monthly_credits_remaining",
} as const;

export const TABLE_USER_SUBSCRIPTIONS = {
	...COMMON,
	TIER: "tier",
	STRIPE_CUSTOMER_ID: "stripe_customer_id",
	STRIPE_SUBSCRIPTION_ID: "stripe_subscription_id",
	CURRENT_PERIOD_START: "current_period_start",
	CURRENT_PERIOD_END: "current_period_end",
	CANCEL_AT_PERIOD_END: "cancel_at_period_end",
} as const;

export const TABLE_CREDIT_TRANSACTIONS = {
	...COMMON,
	AMOUNT: "amount",
	TRANSACTION_TYPE: "transaction_type",
	TRANSACTION_DESCRIPTION: "description",
} as const;

// ════════════════════════════════════════════════════════════════════════════════
// DATA TYPES
// ════════════════════════════════════════════════════════════════════════════════

export const CHAT_ROLES = {
	USER: "user",
	AI: "ai",
} as const;

export type ChatRole = (typeof CHAT_ROLES)[keyof typeof CHAT_ROLES];

export const SUBSCRIPTION_TIERS = {
	FREE: "free",
	HOBBY: "hobby",
	PRO: "pro",
} as const;

export type SubscriptionTier =
	(typeof SUBSCRIPTION_TIERS)[keyof typeof SUBSCRIPTION_TIERS];

export const TRANSACTION_TYPES = {
	INITIAL: "initial",
	SUBSCRIPTION: "subscription",
	PURCHASE: "purchase",
	USAGE: "usage",
	BONUS: "bonus",
	REFUND: "refund",
	MONTHLY_RESET: "monthly_reset",
} as const;

export type TransactionType =
	(typeof TRANSACTION_TYPES)[keyof typeof TRANSACTION_TYPES];

// ════════════════════════════════════════════════════════════════════════════════
// TYPE HELPERS FOR DATABASE OPERATIONS
// ════════════════════════════════════════════════════════════════════════════════

/**
 * Type-safe table name
 */
export type TableName = (typeof TABLES)[keyof typeof TABLES];

/**
 * Type-safe storage bucket name
 */
export type StorageBucketName =
	(typeof STORAGE_BUCKETS)[keyof typeof STORAGE_BUCKETS];

// ════════════════════════════════════════════════════════════════════════════════
// DATABASE INSERT/UPDATE TYPES
// ════════════════════════════════════════════════════════════════════════════════

export type ChatMessageInsert = {
	[TABLE_CHAT_MESSAGES.MIND_MAP_ID]: string;
	[TABLE_CHAT_MESSAGES.USER_ID]: string;
	[TABLE_CHAT_MESSAGES.ROLE]: ChatRole;
	[TABLE_CHAT_MESSAGES.CONTENT]: string;
	[TABLE_CHAT_MESSAGES.MAP_DATA]?: unknown;
};

type GraphData = {
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
		sourceHandle?: string;
	}>;
};

export type MindMapInsert = {
	[TABLE_MIND_MAPS.USER_ID]: string;
	[TABLE_MIND_MAPS.TITLE]: string;
	[TABLE_MIND_MAPS.DESCRIPTION]: string | null;
	[TABLE_MIND_MAPS.FIRST_PROMPT]: string;
	[TABLE_MIND_MAPS.GRAPH_DATA]: GraphData;
};

export type MindMapUpdate = Partial<{
	[TABLE_MIND_MAPS.TITLE]: string;
	[TABLE_MIND_MAPS.DESCRIPTION]: string | null;
	[TABLE_MIND_MAPS.FIRST_PROMPT]: string;
	[TABLE_MIND_MAPS.GRAPH_DATA]: GraphData;
	[TABLE_MIND_MAPS.UPDATED_AT]: string;
}>;

export type UserCreditsInsert = {
	[TABLE_USER_CREDITS.USER_ID]: string;
	[TABLE_USER_CREDITS.CREDITS]: number;
	[TABLE_USER_CREDITS.MONTHLY_CREDITS_REMAINING]: number;
};

export type UserCreditsUpdate = Partial<{
	[TABLE_USER_CREDITS.CREDITS]: number;
	[TABLE_USER_CREDITS.MONTHLY_CREDITS_REMAINING]: number;
	[TABLE_USER_CREDITS.UPDATED_AT]: string;
}>;

export type CreditTransactionInsert = {
	[TABLE_CREDIT_TRANSACTIONS.USER_ID]: string;
	[TABLE_CREDIT_TRANSACTIONS.AMOUNT]: number;
	[TABLE_CREDIT_TRANSACTIONS.TRANSACTION_TYPE]: TransactionType;
	[TABLE_CREDIT_TRANSACTIONS.TRANSACTION_DESCRIPTION]: string | null;
};

export type UserSubscriptionInsert = {
	[TABLE_USER_SUBSCRIPTIONS.USER_ID]: string;
	[TABLE_USER_SUBSCRIPTIONS.TIER]: SubscriptionTier;
	[TABLE_USER_SUBSCRIPTIONS.STRIPE_CUSTOMER_ID]: string | null;
	[TABLE_USER_SUBSCRIPTIONS.STRIPE_SUBSCRIPTION_ID]: string | null;
	[TABLE_USER_SUBSCRIPTIONS.CURRENT_PERIOD_START]: string | null;
	[TABLE_USER_SUBSCRIPTIONS.CURRENT_PERIOD_END]: string | null;
	[TABLE_USER_SUBSCRIPTIONS.CANCEL_AT_PERIOD_END]: boolean;
};

export type UserSubscriptionUpdate = Partial<{
	[TABLE_USER_SUBSCRIPTIONS.TIER]: SubscriptionTier;
	[TABLE_USER_SUBSCRIPTIONS.STRIPE_CUSTOMER_ID]: string | null;
	[TABLE_USER_SUBSCRIPTIONS.STRIPE_SUBSCRIPTION_ID]: string | null;
	[TABLE_USER_SUBSCRIPTIONS.CURRENT_PERIOD_START]: string | null;
	[TABLE_USER_SUBSCRIPTIONS.CURRENT_PERIOD_END]: string | null;
	[TABLE_USER_SUBSCRIPTIONS.CANCEL_AT_PERIOD_END]: boolean;
	[TABLE_USER_SUBSCRIPTIONS.UPDATED_AT]: string;
}>;
