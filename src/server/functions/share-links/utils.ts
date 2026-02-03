import { createClient } from "@supabase/supabase-js";

export const getSupabaseClient = () => {
	const supabaseUrl = process.env.VITE_SUPABASE_URL || "";
	const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || "";
	return createClient(supabaseUrl, supabaseAnonKey);
};

export function generateShareUrl(shareToken: string): string {
	return `${process.env.VITE_APP_URL || "http://localhost:7000"}/share/${shareToken}`;
}
