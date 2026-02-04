/**
 * This file re-exports types from Supabase-generated types.
 *
 * To generate/update Supabase types, run:
 *   npx supabase gen types typescript --local > src/lib/supabase-database.types.ts
 *
 * Or for remote projects:
 *   npx supabase gen types typescript --project-id "$PROJECT_REF" > src/lib/supabase-database.types.ts
 */

// Import Supabase-generated types
// This file should be generated using: npx supabase gen types typescript --local
import type { Database as SupabaseDatabase } from "./supabase-database.types";

// Re-export the Database type from Supabase
export type Database = SupabaseDatabase;

// Extract table row types from Supabase-generated types
export type MindMapProject =
	SupabaseDatabase["public"]["Tables"]["mind_maps"]["Row"];
export type ChatMessage =
	SupabaseDatabase["public"]["Tables"]["chat_messages"]["Row"];
export type UserSubscription =
	SupabaseDatabase["public"]["Tables"]["user_subscriptions"]["Row"];
export type UserCredits =
	SupabaseDatabase["public"]["Tables"]["user_credits"]["Row"];
export type ShareLink =
	SupabaseDatabase["public"]["Tables"]["share_links"]["Row"];

// App-level constants (not database types)
export const SubscriptionTier = {
	FREE: "free",
	HOBBY: "hobby",
	PRO: "pro",
} as const;

export type SubscriptionTierType =
	(typeof SubscriptionTier)[keyof typeof SubscriptionTier];
