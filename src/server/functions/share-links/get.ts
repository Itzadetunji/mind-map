import { createServerFn } from "@tanstack/react-start";
import { getShareLinkSchema } from "@/lib/constants/database.constants";
import { generateShareUrl, getSupabaseClient } from "./utils";

export const getShareLink = createServerFn({ method: "POST" })
	.inputValidator(getShareLinkSchema)
	.handler(async ({ data }) => {
		const { mindMapId, userId } = data;
		const supabase = getSupabaseClient();
		const { data: shareLink, error: rpcError } = await supabase.rpc(
			"get_share_link",
			{
				p_mind_map_id: mindMapId,
				p_user_id: userId,
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
