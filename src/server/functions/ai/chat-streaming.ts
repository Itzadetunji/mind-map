import { createServerFn } from "@tanstack/react-start";
import {
	chatInputSchema,
	chatWithAIStreamingHandler,
} from "./ai-updates-nodes";

export const chatWithAIStreaming = createServerFn({ method: "POST" })
	.inputValidator(chatInputSchema)
	.handler(async ({ data }) => {
		try {
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			return (await chatWithAIStreamingHandler(data)) as any;
		} catch (err) {
			const message = err instanceof Error ? err.message : "Chat failed";
			throw new Error(message);
		}
	});
