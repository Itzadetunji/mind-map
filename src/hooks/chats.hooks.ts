import {
	useInfiniteQuery,
	useMutation,
	useQueryClient,
} from "@tanstack/react-query";
import type { ChatMessage } from "@/lib/database.types";
import { CHAT_ROLES, TABLE_CHAT_MESSAGES, TABLES, type ChatMessageInsert } from "@/lib/database.constants";
import { supabase } from "@/lib/supabase";

const PAGE_SIZE = 20;

export function useChatHistory(mindMapId: string | undefined) {
	const {
		data,
		fetchNextPage,
		hasNextPage,
		isFetchingNextPage,
		isLoading,
		isError,
		error,
	} = useInfiniteQuery({
		queryKey: ["chat_messages", mindMapId],
		queryFn: async ({ pageParam = 0 }) => {
			if (!mindMapId) return [];

			const from = pageParam * PAGE_SIZE;
			const to = from + PAGE_SIZE - 1;

			const { data, error } = await supabase
				.from(TABLES.CHAT_MESSAGES)
				.select("*")
				.eq(TABLE_CHAT_MESSAGES.MIND_MAP_ID, mindMapId)
				.order(TABLE_CHAT_MESSAGES.CREATED_AT, { ascending: false }) // Get newest first for pagination
				.range(from, to);

			if (error) throw error;
			return data as ChatMessage[];
		},
		initialPageParam: 0,
		getNextPageParam: (lastPage, allPages) => {
			if (lastPage.length < PAGE_SIZE) return undefined;
			return allPages.length;
		},
		enabled: !!mindMapId,
		select: (data) => ({
			pages: [...data.pages].reverse(), // Reverse pages so older pages come first in the array
			pageParams: [...data.pageParams].reverse(),
		}),
	});

	return {
		messages: data?.pages.flatMap((page) => [...page].reverse()) || [], // Reverse messages in each page to be chronological
		fetchNextPage,
		hasNextPage,
		isFetchingNextPage,
		isLoading,
		isError,
		error,
	};
}

export function useSendChatMessage() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (message: {
			mind_map_id: string;
			user_id: string;
			role: "user" | "ai";
			content: string;
			map_data?: unknown;
		}) => {
			const insertData: ChatMessageInsert = {
				[TABLE_CHAT_MESSAGES.MIND_MAP_ID]: message.mind_map_id,
				[TABLE_CHAT_MESSAGES.USER_ID]: message.user_id,
				[TABLE_CHAT_MESSAGES.ROLE]: message.role as typeof CHAT_ROLES[keyof typeof CHAT_ROLES],
				[TABLE_CHAT_MESSAGES.CONTENT]: message.content,
				...(message.map_data ? { [TABLE_CHAT_MESSAGES.MAP_DATA]: message.map_data } : {}),
			};
			const { data, error } = await supabase
				.from(TABLES.CHAT_MESSAGES)
				.insert(insertData)
				.select()
				.single();

			if (error) throw error;
			return data;
		},
		onSuccess: (_, variables) => {
			// We invalidate the infinite query, but since we modify the cache manually in the UI usually for optimistic updates,
			// we might want to just refetch or rely on the UI state until refresh.
			// For now, simple invalidation.
			queryClient.invalidateQueries({
				queryKey: ["chat_messages", variables.mind_map_id],
			});
		},
	});
}
