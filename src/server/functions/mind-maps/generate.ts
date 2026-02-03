import { createServerFn } from "@tanstack/react-start";
import {
	generateMindMapHandler,
	generateMindMapInputSchema,
} from "./generate-mind-map";

export const generateMindMap = createServerFn({ method: "POST" })
	.inputValidator(generateMindMapInputSchema)
	.handler(async ({ data }) => {
		try {
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			return (await generateMindMapHandler(data)) as any;
		} catch (err) {
			const message = err instanceof Error ? err.message : "Generation failed";
			throw new Error(message);
		}
	});
