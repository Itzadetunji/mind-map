import { createServerFn } from "@tanstack/react-start";
import { revokeShareLinkSchema } from "@/lib/database.constants";
import { getSupabaseClient } from "./utils";

// Revoke share link
export const revokeShareLink = createServerFn({ method: "POST" })
	.inputValidator(revokeShareLinkSchema)
	.handler(async ({ data }) => {
		const supabase = getSupabaseClient();

		// Use RPC function that handles ownership verification and deletion
		const { error: rpcError } = await supabase.rpc("revoke_share_link", {
			p_mind_map_id: data.mindMapId,
			p_user_id: data.userId,
		});

		if (rpcError) {
			throw new Error(rpcError.message || "Failed to revoke share link");
		}

		return { success: true };
	});
