import { createClient } from "@supabase/supabase-js";

export const getSupabaseAdminClient = () => {
	const supabaseUrl = process.env.VITE_SUPABASE_URL || "";
	const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

	if (!supabaseUrl || !serviceRoleKey) {
		throw new Error(
			"Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables",
		);
	}

	return createClient(supabaseUrl, serviceRoleKey);
};