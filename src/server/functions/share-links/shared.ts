import { createServerFn } from "@tanstack/react-start";
import { getSharedMindMapSchema } from "@/lib/constants/database.constants";
import { getSupabaseClient } from "./utils";

export const getSharedMindMap = createServerFn({ method: "POST" })
	.inputValidator(getSharedMindMapSchema)
	.handler(async ({ data }) => {
		const { shareToken } = data;
		const supabase = getSupabaseClient();
		const { data: mindMapData, error: rpcError } = await supabase.rpc(
			"get_shared_mind_map_by_token",
			{ p_share_token: shareToken },
		);
		if (rpcError) {
			throw new Error("Share link not found or invalid");
		}
		if (!mindMapData || mindMapData.length === 0) {
			throw new Error("Mind map not found");
		}
		const mindMap = mindMapData[0];
		return {
			mindMap: {
				id: mindMap.mind_map_id,
				title: mindMap.title,
				description: mindMap.description,
				graph_data: mindMap.graph_data,
			},
		};
	});
