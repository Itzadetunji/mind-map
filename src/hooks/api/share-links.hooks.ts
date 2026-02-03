import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
	createShareLink,
	getShareLink,
	revokeShareLink,
} from "@/server/v1/share-links";
import { useAuthStore } from "@/stores/authStore";

export const shareLinksQueryKeys = {
	all: ["share_links"] as const,
	detail: (mindMapId?: string | null, userId?: string) =>
		[...shareLinksQueryKeys.all, mindMapId, userId] as const,
} as const;

export function useShareLink(mindMapId: string | null) {
	const user = useAuthStore((state) => state.user);

	return useQuery({
		queryKey: shareLinksQueryKeys.detail(mindMapId, user?.id),
		queryFn: async () => {
			if (!user || !mindMapId) return null;

			const result = await getShareLink({
				data: {
					mindMapId,
					userId: user.id,
				},
			});

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

			const result = await createShareLink({
				data: {
					mindMapId,
					userId: user.id,
				},
			});

			return result;
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

			await revokeShareLink({
				data: {
					mindMapId,
					userId: user.id,
				},
			});
		},
		onSuccess: (_, mindMapId) => {
			queryClient.invalidateQueries({
				queryKey: shareLinksQueryKeys.detail(mindMapId, user?.id),
			});
		},
	});
}
