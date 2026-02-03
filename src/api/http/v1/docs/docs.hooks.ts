import { useMutation } from "@tanstack/react-query";
import { generateDocumentation } from "@/server/functions/docs/generate";
import type { GenerateDocsPayload, GenerateDocsResponse } from "./docs.types";

export function useGenerateDocumentation() {
	return useMutation<GenerateDocsResponse, Error, GenerateDocsPayload>({
		mutationFn: (data) => generateDocumentation({ data }),
	});
}
