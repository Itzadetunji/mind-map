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
	ADVERTISEMENTS: "advertisements",
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

// Advertisements table
export const TABLE_ADVERTISEMENTS = {
	ID: "id",
	USER_ID: "user_id",
	WEBSITE_URL: "website_url",
	NAME: "name",
	DESCRIPTION: "description",
	LOGO_URL: "logo_url",
	STATUS: "status",
	APPROVED: "approved",
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
	CANCELLED_AT: "cancelled_at",
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
// DATABASE INSERT/UPDATE TYPES (from Supabase-generated types)
// ════════════════════════════════════════════════════════════════════════════════

import type { Database } from "../database.types";

// Re-export Insert and Update types from Supabase-generated types
export type AdvertisementInsert =
	Database["public"]["Tables"]["advertisements"]["Insert"];
export type AdvertisementUpdate =
	Database["public"]["Tables"]["advertisements"]["Update"];

export type ChatMessageInsert =
	Database["public"]["Tables"]["chat_messages"]["Insert"];
export type ChatMessageUpdate =
	Database["public"]["Tables"]["chat_messages"]["Update"];

export type MindMapInsert = Database["public"]["Tables"]["mind_maps"]["Insert"];
export type MindMapUpdate = Database["public"]["Tables"]["mind_maps"]["Update"];

export type UserCreditsInsert =
	Database["public"]["Tables"]["user_credits"]["Insert"];
export type UserCreditsUpdate =
	Database["public"]["Tables"]["user_credits"]["Update"];

export type UserSubscriptionInsert =
	Database["public"]["Tables"]["user_subscriptions"]["Insert"];
export type UserSubscriptionUpdate =
	Database["public"]["Tables"]["user_subscriptions"]["Update"];

export type ShareLinkInsert =
	Database["public"]["Tables"]["share_links"]["Insert"];
export type ShareLinkUpdate =
	Database["public"]["Tables"]["share_links"]["Update"];

// ════════════════════════════════════════════════════════════════════════════════
// VALIDATION SCHEMAS (Zod)
// ════════════════════════════════════════════════════════════════════════════════

import { z } from "zod";

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
