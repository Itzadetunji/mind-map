import { createServerFn } from "@tanstack/react-start";
import { revokeShareLinkSchema } from "@/lib/constants/database.constants";
import { getSupabaseClient } from "./utils";

export const revokeShareLink = createServerFn({ method: "POST" })
	.inputValidator(revokeShareLinkSchema)
	.handler(async ({ data }) => {
		const { mindMapId, userId } = data;
		const supabase = getSupabaseClient();
		const { error: rpcError } = await supabase.rpc("revoke_share_link", {
			p_mind_map_id: mindMapId,
			p_user_id: userId,
		});
		if (rpcError) {
			throw new Error(rpcError.message || "Failed to revoke share link");
		}
		return { success: true };
	});
