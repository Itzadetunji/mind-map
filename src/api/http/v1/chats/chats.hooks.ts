import {
	useInfiniteQuery,
	useMutation,
	useQueryClient,
} from "@tanstack/react-query";
import type { Database, Json } from "@/lib/supabase-database.types";
import type { ChatMessage } from "@/lib/database.types";
import { supabase } from "@/lib/supabase";

export const chatsQueryKeys = {
	all: ["chat_messages"] as const,
	messages: (mindMapId?: string) => [...chatsQueryKeys.all, mindMapId] as const,
} as const;

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
		queryKey: chatsQueryKeys.messages(mindMapId),
		queryFn: async ({ pageParam = 0 }) => {
			if (!mindMapId) return [];

			const from = pageParam * PAGE_SIZE;
			const to = from + PAGE_SIZE - 1;

			const { data, error } = await supabase
				.from("chat_messages")
				.select("*")
				.eq("mind_map_id", mindMapId)
				.order("created_at", { ascending: false })
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
			pages: [...data.pages].reverse(),
			pageParams: [...data.pageParams].reverse(),
		}),
	});

	return {
		messages: data?.pages.flatMap((page) => [...page].reverse()) || [],
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
			map_data?: Json | null;
		}) => {
			const insertData: Database["public"]["Tables"]["chat_messages"]["Insert"] =
				{
					mind_map_id: message.mind_map_id,
					user_id: message.user_id,
					role: message.role,
					content: message.content,
					...(message.map_data !== undefined
						? { map_data: message.map_data }
						: {}),
				};
			const { data, error } = await supabase
				.from("chat_messages")
				.insert(insertData as never)
				.select()
				.single();

			if (error) throw error;
			return data;
		},
		onSuccess: (_, variables) => {
			queryClient.invalidateQueries({
				queryKey: chatsQueryKeys.messages(variables.mind_map_id),
			});
		},
	});
}
