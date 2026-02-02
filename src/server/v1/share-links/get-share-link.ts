import { createServerFn } from "@tanstack/react-start";
import { getShareLinkSchema } from "@/lib/constants/database.constants";
import { generateShareUrl, getSupabaseClient } from "./utils";

// Get share link for a mind map
export const getShareLink = createServerFn({ method: "POST" })
	.inputValidator(getShareLinkSchema)
	.handler(async ({ data }) => {
		const supabase = getSupabaseClient();

		// Use RPC function that handles ownership verification
		const { data: shareLink, error: rpcError } = await supabase.rpc(
			"get_share_link",
			{
				p_mind_map_id: data.mindMapId,
				p_user_id: data.userId,
			},
		);

		if (rpcError) {
			throw new Error(rpcError.message || "Failed to fetch share link");
		}

		if (!shareLink || shareLink.length === 0) {
			return { shareLink: null };
		}

		return {
			shareLink: {
				shareToken: shareLink[0].share_token,
				shareUrl: generateShareUrl(shareLink[0].share_token),
			},
		};
	});
