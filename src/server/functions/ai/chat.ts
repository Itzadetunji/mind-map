import { createServerFn } from "@tanstack/react-start";
import { chatInputSchema, chatWithAIHandler } from "./ai-updates-nodes";

export const chatWithAI = createServerFn({ method: "POST" })
	.inputValidator(chatInputSchema)
	.handler(async ({ data }) => {
		try {
			return await chatWithAIHandler(data);
		} catch (err) {
			const message = err instanceof Error ? err.message : "Chat failed";
			throw new Error(message);
		}
	});
