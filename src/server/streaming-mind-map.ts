import { createServerFn } from "@tanstack/react-start";
import OpenAI from "openai";
import { z } from "zod";

const streamMindMapInputSchema = z.object({
	prompt: z.string().min(1, "Prompt is required"),
	existingContext: z
		.object({
			nodes: z.array(z.any()).optional(),
			edges: z.array(z.any()).optional(),
		})
		.optional(),
});

// System prompt (same as generate-mind-map.ts but exported for reuse)
export const mindMapSystemPrompt = `
You are an expert UX/product designer and technical architect. Your mission is to generate comprehensive, developer-friendly mind maps that break down app ideas into clear user flows.

═══════════════════════════════════════════════════════════════════════════════
THE 5-STEP PROCESS: TASK → CONTEXT → REFERENCES → EVALUATE → ITERATE
═══════════════════════════════════════════════════════════════════════════════

Before generating ANY nodes or edges, you MUST work through these 5 steps and document your thinking in the "reasoning" field:

┌─────────────────────────────────────────────────────────────────────────────┐
│ STEP 1: TASK - Understand What The User Wants                               │
└─────────────────────────────────────────────────────────────────────────────┘
- What is the core app/product idea?
- What problem does it solve?
- Who is the target user?
- What is the scope? (MVP, full product, specific feature?)
- If the prompt is vague, state what assumptions you're making and why.

┌─────────────────────────────────────────────────────────────────────────────┐
│ STEP 2: CONTEXT - Gather Domain Knowledge                                   │
└─────────────────────────────────────────────────────────────────────────────┘
- What category does this app fall into? (social, e-commerce, productivity, etc.)
- What are the industry-standard patterns for this type of app?
- What similar successful apps exist? (Reference them: "Like Spotify's...", "Similar to Uber's...")
- What are the expected user mental models?
- What technical constraints exist in 2026? (API limitations, platform rules, etc.)

┌─────────────────────────────────────────────────────────────────────────────┐
│ STEP 3: REFERENCES - Map to Established Patterns                            │
└─────────────────────────────────────────────────────────────────────────────┘
- Identify 3-5 reference apps/patterns you're drawing from
- For each user flow, cite WHY you structured it that way

┌─────────────────────────────────────────────────────────────────────────────┐
│ STEP 4: EVALUATE - Assess Developer-Friendliness                            │
└─────────────────────────────────────────────────────────────────────────────┘
Before finalizing, evaluate your output against these criteria for both beginner and intermediate developers.

┌─────────────────────────────────────────────────────────────────────────────┐
│ STEP 5: ITERATE - Refine Using Tree-of-Thoughts                             │
└─────────────────────────────────────────────────────────────────────────────┘
For each major flow, explore multiple approaches before committing.

═══════════════════════════════════════════════════════════════════════════════
OUTPUT FORMAT
═══════════════════════════════════════════════════════════════════════════════

Output strictly valid JSON (no markdown, no code blocks):

{
  "reasoning": "Your complete 5-step thought process here",
  "nodes": [...],
  "edges": [...]
}

NODE TYPES (USE ONLY THESE):
1. "core-concept" - Root node at {x: 0, y: 0}
2. "user-flow" - Major journey entry points (connects to root)
3. "screen-ui" - Actual UI screens with features array
4. "condition" - Decision/branching points
5. "feature" - Grouped capabilities with features array
6. "custom-node" - Technical risks/integrations

POSITIONING: 700px horizontal spacing between flows, 350px vertical spacing within flows.
`;

export const streamMindMap = createServerFn({ method: "POST" })
	.inputValidator(streamMindMapInputSchema)
	.handler(async ({ data }) => {
		const apiKey = process.env.OPENAI_API_KEY;
		if (!apiKey) {
			throw new Error("Missing OPENAI_API_KEY");
		}

		const openai = new OpenAI({ apiKey });

		// For streaming, we'll return chunks that the client can process
		const response = await openai.chat.completions.create({
			model: "gpt-4o-2024-08-06",
			messages: [
				{ role: "system", content: mindMapSystemPrompt },
				{
					role: "user",
					content: data.existingContext
						? `Current mind map context:\n${JSON.stringify(data.existingContext, null, 2)}\n\nUser request: ${data.prompt}`
						: data.prompt,
				},
			],
			stream: false, // We'll handle streaming differently
			temperature: 0.7,
			max_tokens: 8000,
		});

		const content = response.choices[0].message.content;
		if (!content) throw new Error("No content returned");

		return JSON.parse(content);
	});

// Chat-specific server function for conversational AI
const chatInputSchema = z.object({
	message: z.string().min(1),
	projectContext: z
		.object({
			title: z.string(),
			prompt: z.string(),
			nodes: z.array(z.any()),
			edges: z.array(z.any()),
		})
		.optional(),
	chatHistory: z
		.array(
			z.object({
				role: z.enum(["user", "assistant"]),
				content: z.string(),
			}),
		)
		.optional(),
});

export const chatWithAI = createServerFn({ method: "POST" })
	.inputValidator(chatInputSchema)
	.handler(async ({ data }) => {
		const apiKey = process.env.OPENAI_API_KEY;
		if (!apiKey) {
			throw new Error("Missing OPENAI_API_KEY");
		}

		const openai = new OpenAI({ apiKey });

		const systemMessage = `You are an AI assistant helping users refine their mind map designs. You have access to their current mind map and can suggest improvements, answer questions about UX patterns, and help them think through their app architecture.

${
	data.projectContext
		? `Current Project: "${data.projectContext.title}"
Original Prompt: "${data.projectContext.prompt}"
Current Structure: ${data.projectContext.nodes.length} nodes, ${data.projectContext.edges.length} edges`
		: "No project context available."
}

When suggesting changes to the mind map, format your response with clear sections:
1. ANALYSIS: Your understanding of the request
2. SUGGESTIONS: Specific changes to make
3. REASONING: Why these changes improve the design

If the user wants you to generate/update the mind map, include a JSON block with the new nodes/edges.`;

		const messages: Array<{
			role: "system" | "user" | "assistant";
			content: string;
		}> = [{ role: "system", content: systemMessage }];

		// Add chat history
		if (data.chatHistory) {
			for (const msg of data.chatHistory.slice(-10)) {
				messages.push({ role: msg.role, content: msg.content });
			}
		}

		messages.push({ role: "user", content: data.message });

		const response = await openai.chat.completions.create({
			model: "gpt-4o",
			messages,
			temperature: 0.7,
			max_tokens: 2000,
		});

		return {
			content: response.choices[0].message.content || "",
		};
	});
