import { useMutation } from "@tanstack/react-query";
import { chatWithAI } from "@/server/functions/ai/chat";
import { chatWithAIStreaming } from "@/server/functions/ai/chat-streaming";
import type { ChatInput, ChatResponse } from "./ai.types";

export function useChatWithAIStreaming() {
	return useMutation<ChatResponse, Error, ChatInput>({
		mutationFn: async (data) =>
			chatWithAIStreaming({ data }) as Promise<ChatResponse>,
	});
}

export function useChatWithAI() {
	return useMutation<ChatResponse, Error, ChatInput>({
		mutationFn: async (data) => chatWithAI({ data }) as Promise<ChatResponse>,
	});
}
