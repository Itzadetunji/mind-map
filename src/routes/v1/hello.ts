// routes/hello.ts
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/v1/hello")({
	server: {
		handlers: {
			GET: async ({ request }) => {
				return new Response("Hello, World! from " + request.url);
			},
		},
	},
});
