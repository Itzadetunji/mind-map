import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createShareLink } from "@/server/functions/share-links/create";
import { getShareLink } from "@/server/functions/share-links/get";
import { revokeShareLink } from "@/server/functions/share-links/revoke";
import { getSharedMindMap } from "@/server/functions/share-links/shared";
import { useAuthStore } from "@/stores/authStore";
import type {
	GetSharedMindMapResponse,
	ShareLinkInfo,
} from "./share-links.types";

export const shareLinksQueryKeys = {
	all: ["share_links"] as const,
	detail: (mindMapId?: string | null, userId?: string) =>
		[...shareLinksQueryKeys.all, mindMapId, userId] as const,
	shared: (shareToken?: string) =>
		[...shareLinksQueryKeys.all, "shared", shareToken] as const,
} as const;

export function useShareLink(mindMapId: string | null) {
	const user = useAuthStore((state) => state.user);

	return useQuery({
		queryKey: shareLinksQueryKeys.detail(mindMapId, user?.id),
		queryFn: async (): Promise<ShareLinkInfo | null> => {
			if (!user || !mindMapId) return null;
			const result = await getShareLink({ data: { mindMapId, userId: user.id } });
			return result.shareLink;
		},
		enabled: !!user && !!mindMapId,
	});
}

export function useCreateShareLink() {
	const queryClient = useQueryClient();
	const user = useAuthStore((state) => state.user);

	return useMutation({
		mutationFn: async (mindMapId: string) => {
			if (!user) throw new Error("User not authenticated");
			return createShareLink({ data: { mindMapId, userId: user.id } });
		},
		onSuccess: (_, mindMapId) => {
			queryClient.invalidateQueries({
				queryKey: shareLinksQueryKeys.detail(mindMapId, user?.id),
			});
		},
	});
}

export function useRevokeShareLink() {
	const queryClient = useQueryClient();
	const user = useAuthStore((state) => state.user);

	return useMutation({
		mutationFn: async (mindMapId: string) => {
			if (!user) throw new Error("User not authenticated");
			await revokeShareLink({ data: { mindMapId, userId: user.id } });
		},
		onSuccess: (_, mindMapId) => {
			queryClient.invalidateQueries({
				queryKey: shareLinksQueryKeys.detail(mindMapId, user?.id),
			});
		},
	});
}

export function useSharedMindMap(shareToken: string | undefined) {
	return useQuery({
		queryKey: shareLinksQueryKeys.shared(shareToken),
		queryFn: (): Promise<GetSharedMindMapResponse> => {
			if (!shareToken) throw new Error("Share token required");
			return getSharedMindMap({ data: { shareToken } });
		},
		enabled: !!shareToken,
	});
}
