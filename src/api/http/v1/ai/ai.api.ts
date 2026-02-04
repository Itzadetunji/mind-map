import $http from "../../xhr";
import type { ChatInput, ChatResponse } from "./ai.types";

export const AI_ENDPOINTS = {
	chat: "/ai/chat",
	chatStreaming: "/ai/chat-streaming",
} as const;
ch;

export const AI_API = {
	CHAT: async (data: ChatInput): Promise<ChatResponse> =>
		$http.post<ChatResponse>(AI_ENDPOINTS.chat, data).then((res) => res.data),

	CHAT_STREAMING: async (data: ChatInput): Promise<ChatResponse> =>
		$http
			.post<ChatResponse>(AI_ENDPOINTS.chatStreaming, data)
			.then((res) => res.data),
};
