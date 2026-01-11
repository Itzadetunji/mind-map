import { createClient } from "@supabase/supabase-js";
import { createServerFn } from "@tanstack/react-start";
import OpenAI from "openai";
import { z } from "zod";

// Server-side Supabase client using environment variables
const getSupabaseClient = () => {
	const supabaseUrl = process.env.VITE_SUPABASE_URL || "";
	const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || "";
	return createClient(supabaseUrl, supabaseAnonKey);
};

const generateMindMapInputSchema = z.object({
	prompt: z.string().min(1, "Prompt is required"),
});

export const generateMindMap = createServerFn({ method: "POST" })
	.inputValidator(generateMindMapInputSchema)
	.handler(async ({ data }) => {
		const apiKey = process.env.OPENAI_API_KEY;

		if (!apiKey) {
			throw new Error("Missing OPENAI_API_KEY");
		}

		const openai = new OpenAI({ apiKey });

		const systemPrompt = `
      You are an expert mind map generator. 
      You will be given a topic or description, and you must generate a mind map structure.
      Return strictly a JSON object with two arrays: "nodes" and "edges".
      
      Nodes should have:
      - id: string (unique)
      - type: "core-concept" | "feature" | "user-flow" | "screen-ui" | "condition" | "custom-node"
      - position: { x: number, y: number } (Calculate reasonable positions for a tree layout growing from center)
      - data: { label: string, description?: string, features?: {id:string, label:string}[] (only for feature node) }

      Edges should have:
      - id: string
      - source: string (node id)
      - target: string (node id)

      The root node should be at {x:0, y:0} and be of type "core-concept".
      Spread other nodes out so they don't overlap too much.
      Do not include markdown formatting or code blocks. Just the raw JSON.
    `;

		try {
			const response = await openai.chat.completions.create({
				model: "gpt-4-turbo-preview",
				messages: [
					{ role: "system", content: systemPrompt },
					{ role: "user", content: data.prompt },
				],
				response_format: { type: "json_object" },
			});

			const content = response.choices[0].message.content;
			if (!content) throw new Error("No content generated");

			const graphData = JSON.parse(content);

			// Save to Supabase
			const supabase = getSupabaseClient();
			const { error: dbError } = await supabase.from("mind_maps").insert({
				prompt: data.prompt,
				graph_data: graphData,
			});

			if (dbError) {
				console.error("Supabase error:", dbError);
				// We might validly want to return the graph even if save fails, but for now lets warn.
			}

			return graphData;
		} catch (error) {
			console.error("Error generating mind map:", error);
			throw error;
		}
	});
