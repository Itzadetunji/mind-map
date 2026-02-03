import { createServerFn } from "@tanstack/react-start";
import { v4 as uuidv4 } from "uuid";
import { createShareLinkSchema } from "@/lib/constants/database.constants";
import { generateShareUrl, getSupabaseClient } from "./utils";

export const createShareLink = createServerFn({ method: "POST" })
	.inputValidator(createShareLinkSchema)
	.handler(async ({ data }) => {
		const { mindMapId, userId } = data;
		const supabase = getSupabaseClient();
		const shareToken = uuidv4();
		const { data: shareLink, error: rpcError } = await supabase.rpc(
			"create_or_update_share_link",
			{
				p_mind_map_id: mindMapId,
				p_user_id: userId,
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
