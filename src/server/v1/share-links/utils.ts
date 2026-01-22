import { createClient } from "@supabase/supabase-js";

// Server-side Supabase client
export const getSupabaseClient = () => {
	const supabaseUrl = process.env.VITE_SUPABASE_URL || "";
	const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || "";
	return createClient(supabaseUrl, supabaseAnonKey);
};

// Generate share URL from token
export function generateShareUrl(shareToken: string): string {
	return `${process.env.VITE_APP_URL || "http://localhost:7000"}/share/${shareToken}`;
}
