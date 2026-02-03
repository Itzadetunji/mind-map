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
	SHARE_LINKS: "share_links",
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
	MONTHLY_CREDITS_USED: "monthly_credits_used",
	LAST_DAILY_CREDIT_CLAIMED_AT: "last_daily_credit_claimed_at",
} as const;

export const TABLE_USER_SUBSCRIPTIONS = {
	...COMMON,
	TIER: "tier",
	DODO_CUSTOMER_ID: "dodo_customer_id",
	DODO_SUBSCRIPTION_ID: "dodo_subscription_id",
	CURRENT_PERIOD_START: "current_period_start",
	CURRENT_PERIOD_END: "current_period_end",
	CANCEL_AT_PERIOD_END: "cancel_at_period_end",
} as const;

export const TABLE_SHARE_LINKS = {
	...COMMON,
	MIND_MAP_ID: "mind_map_id",
	SHARE_TOKEN: "share_token",
} as const;

// ════════════════════════════════════════════════════════════════════════════════
// DATA TYPES
// ════════════════════════════════════════════════════════════════════════════════

export const CHAT_ROLES = {
	USER: "user",
	AI: "ai",
} as const;

export type ChatRole = (typeof CHAT_ROLES)[keyof typeof CHAT_ROLES];

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
	[TABLE_USER_CREDITS.MONTHLY_CREDITS_USED]?: number;
	[TABLE_USER_CREDITS.LAST_DAILY_CREDIT_CLAIMED_AT]?: string | null;
};

export type UserCreditsUpdate = Partial<{
	[TABLE_USER_CREDITS.CREDITS]: number;
	[TABLE_USER_CREDITS.MONTHLY_CREDITS_REMAINING]: number;
	[TABLE_USER_CREDITS.MONTHLY_CREDITS_USED]: number;
	[TABLE_USER_CREDITS.LAST_DAILY_CREDIT_CLAIMED_AT]: string | null;
	[TABLE_USER_CREDITS.UPDATED_AT]: string;
}>;

export type UserSubscriptionInsert = {
	[TABLE_USER_SUBSCRIPTIONS.USER_ID]: string;
	[TABLE_USER_SUBSCRIPTIONS.TIER]: SubscriptionTierType;
	[TABLE_USER_SUBSCRIPTIONS.DODO_CUSTOMER_ID]: string | null;
	[TABLE_USER_SUBSCRIPTIONS.DODO_SUBSCRIPTION_ID]: string | null;
	[TABLE_USER_SUBSCRIPTIONS.CURRENT_PERIOD_START]: string | null;
	[TABLE_USER_SUBSCRIPTIONS.CURRENT_PERIOD_END]: string | null;
	[TABLE_USER_SUBSCRIPTIONS.CANCEL_AT_PERIOD_END]: boolean;
};

export type UserSubscriptionUpdate = Partial<{
	[TABLE_USER_SUBSCRIPTIONS.TIER]: SubscriptionTierType;
	[TABLE_USER_SUBSCRIPTIONS.DODO_CUSTOMER_ID]: string | null;
	[TABLE_USER_SUBSCRIPTIONS.DODO_SUBSCRIPTION_ID]: string | null;
	[TABLE_USER_SUBSCRIPTIONS.CURRENT_PERIOD_START]: string | null;
	[TABLE_USER_SUBSCRIPTIONS.CURRENT_PERIOD_END]: string | null;
	[TABLE_USER_SUBSCRIPTIONS.CANCEL_AT_PERIOD_END]: boolean;
	[TABLE_USER_SUBSCRIPTIONS.UPDATED_AT]: string;
}>;

export type ShareLinkInsert = {
	[TABLE_SHARE_LINKS.MIND_MAP_ID]: string;
	[TABLE_SHARE_LINKS.USER_ID]: string;
	[TABLE_SHARE_LINKS.SHARE_TOKEN]: string;
};

export type ShareLinkUpdate = Partial<{
	[TABLE_SHARE_LINKS.SHARE_TOKEN]: string;
	[TABLE_SHARE_LINKS.UPDATED_AT]: string;
}>;

// ════════════════════════════════════════════════════════════════════════════════
// VALIDATION SCHEMAS (Zod)
// ════════════════════════════════════════════════════════════════════════════════

import { z } from "zod";
import type { SubscriptionTierType } from "../database.types";

export const createShareLinkSchema = z.object({
	mindMapId: z.string().min(1),
	userId: z.string().min(1),
});

export const revokeShareLinkSchema = z.object({
	mindMapId: z.string().min(1),
	userId: z.string().min(1),
});

export const getShareLinkSchema = z.object({
	mindMapId: z.string().min(1),
	userId: z.string().min(1),
});

export const getSharedMindMapSchema = z.object({
	shareToken: z.string().min(1),
});
