import { createServerFn } from "@tanstack/react-start";
import {
	generateDocumentationHandler,
	generateDocumentationInputSchema,
} from "./generate-documentation";

export const generateDocumentation = createServerFn({ method: "POST" })
	.inputValidator(generateDocumentationInputSchema)
	.handler(async ({ data }) => {
		try {
			return await generateDocumentationHandler(data);
		} catch (err) {
			const message =
				err instanceof Error ? err.message : "Documentation generation failed";
			throw new Error(message);
		}
	});
