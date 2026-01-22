import { createServerFn } from "@tanstack/react-start";
import { v4 as uuidv4 } from "uuid";
import { createShareLinkSchema } from "@/lib/database.constants";
import { generateShareUrl, getSupabaseClient } from "./utils";

// Create or update share link (one per mind map)
export const createShareLink = createServerFn({ method: "POST" })
	.inputValidator(createShareLinkSchema)
	.handler(async ({ data }) => {
		const supabase = getSupabaseClient();

		const shareToken = uuidv4();

		// Use RPC function that handles ownership verification and create/update logic
		const { data: shareLink, error: rpcError } = await supabase.rpc(
			"create_or_update_share_link",
			{
				p_mind_map_id: data.mindMapId,
				p_user_id: data.userId,
				p_share_token: shareToken,
			},
		);

		if (rpcError) {
			throw new Error(rpcError.message || "Failed to create share link");
		}

		if (!shareLink || shareLink.length === 0) {
			throw new Error("Failed to create share link");
		}

		return {
			shareToken: shareLink[0].share_token,
			shareUrl: generateShareUrl(shareLink[0].share_token),
		};
	});
