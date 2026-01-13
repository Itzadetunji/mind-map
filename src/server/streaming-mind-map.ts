import { createServerFn } from "@tanstack/react-start";
import OpenAI from "openai";
import { z } from "zod";

// ══════════════════════════════════════════════════════════════════════════════
// SHARED SYSTEM PROMPT - Same as generate-mind-map.ts
// ══════════════════════════════════════════════════════════════════════════════
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
- Example: "The checkout flow follows Amazon's 1-click pattern because..."

┌─────────────────────────────────────────────────────────────────────────────┐
│ STEP 4: EVALUATE - Assess Developer-Friendliness                            │
└─────────────────────────────────────────────────────────────────────────────┘
Before finalizing, evaluate your output against these criteria:

FOR BEGINNER DEVELOPERS:
✓ Can they understand the flow by reading node labels alone?
✓ Are technical terms explained in descriptions?
✓ Is the progression logical?

FOR INTERMEDIATE DEVELOPERS:
✓ Are the screen-ui nodes detailed enough to start wireframing?
✓ Are condition nodes capturing real business logic?
✓ Could they estimate development time from this map?

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

// Get the full system prompt for first message (same as generate-mind-map)
const getFirstMessageSystemPrompt = (projectContext?: {
	title: string;
	prompt: string;
	nodes: unknown[];
	edges: unknown[];
}) => `
${mindMapSystemPrompt}

═══════════════════════════════════════════════════════════════════════════════
CHAT MODE INSTRUCTIONS
═══════════════════════════════════════════════════════════════════════════════

You are now in chat mode helping the user build their mind map. Since this is their FIRST message, 
treat it as if they want to generate a new mind map from scratch.

${
	projectContext && projectContext.nodes.length > 1
		? `═══════════════════════════════════════════════════════════════════════════════
CURRENT PROJECT CONTEXT (existing work to build upon)
═══════════════════════════════════════════════════════════════════════════════
Project: "${projectContext.title}"
Original Prompt: "${projectContext.prompt}"
Current Structure: ${projectContext.nodes.length} nodes, ${projectContext.edges.length} edges
Current Nodes: ${JSON.stringify(projectContext.nodes, null, 2)}
Current Edges: ${JSON.stringify(projectContext.edges, null, 2)}`
		: `The user is starting fresh with a new project.`
}

YOUR RESPONSE FORMAT:

ALWAYS respond with valid JSON in this format:

{
  "thinking": {
    "task": "What does the user want? (1-2 sentences)",
    "context": "Relevant domain knowledge and patterns (1-2 sentences)",
    "references": "Apps or patterns I'm drawing from (1-2 sentences)",
    "evaluation": "How this improves the design (1-2 sentences)",
    "iteration": "Any alternatives I considered (1-2 sentences)"
  },
  "message": "Your conversational response to the user explaining what you did and why",
  "action": "generate",
  "graphData": {
    "nodes": [...],
    "edges": [...]
  }
}

For the first message, ALWAYS use action: "generate" and create a complete mind map.
`;

// Chat-specific system prompt for conversational AI (subsequent messages)
const getChatSystemPrompt = (projectContext?: {
	title: string;
	prompt: string;
	nodes: unknown[];
	edges: unknown[];
}) => `
You are an AI assistant helping users build and refine their mind map designs. You use the same 5-step thinking process as the mind map generator.

${
	projectContext
		? `═══════════════════════════════════════════════════════════════════════════════
CURRENT PROJECT CONTEXT
═══════════════════════════════════════════════════════════════════════════════
Project: "${projectContext.title}"
Original Prompt: "${projectContext.prompt}"
Current Structure: ${projectContext.nodes.length} nodes, ${projectContext.edges.length} edges
Current Nodes: ${JSON.stringify(projectContext.nodes, null, 2)}
Current Edges: ${JSON.stringify(projectContext.edges, null, 2)}`
		: `No existing project - user is starting fresh.`
}

═══════════════════════════════════════════════════════════════════════════════
YOUR RESPONSE FORMAT
═══════════════════════════════════════════════════════════════════════════════

ALWAYS respond with valid JSON in this format:

{
  "thinking": {
    "task": "What does the user want? (1-2 sentences)",
    "context": "Relevant domain knowledge and patterns (1-2 sentences)",
    "references": "Apps or patterns I'm drawing from (1-2 sentences)",
    "evaluation": "How this improves the design (1-2 sentences)",
    "iteration": "Any alternatives I considered (1-2 sentences)"
  },
  "message": "Your conversational response to the user explaining what you did and why",
  "action": "generate" | "modify" | "none",
  "graphData": {
    "nodes": [...],
    "edges": [...]
  } | null
}

ACTION TYPES:
- "generate": Create a complete new mind map from scratch
- "modify": Update the existing mind map (add/remove/change nodes)
- "none": Just answering a question, no graph changes needed

WHEN TO USE EACH ACTION:
- User asks to "create", "build", "generate" a new mind map → "generate"
- User asks to "add", "change", "remove", "update" something → "modify" 
- User asks a question or wants explanation → "none"

FOR "generate" ACTION:
- Include FULL graph structure with root "core-concept" node at {x: 0, y: 0}
- Follow the same node types and positioning rules as the main generator

FOR "modify" ACTION:
- Return the COMPLETE updated graph (not just the changes)
- Preserve existing nodes/edges unless explicitly asked to remove them
- Keep the root node unless rebuilding from scratch

FOR "none" ACTION:
- Set graphData to null
- Just provide a helpful message

${mindMapSystemPrompt}
`;

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
	isFirstMessage: z.boolean().optional(),
});

export const chatWithAI = createServerFn({ method: "POST" })
	.inputValidator(chatInputSchema)
	.handler(async ({ data }) => {
		const apiKey = process.env.OPENAI_API_KEY;
		if (!apiKey) {
			throw new Error("Missing OPENAI_API_KEY");
		}

		const openai = new OpenAI({ apiKey });

		// Use full system prompt for first message, otherwise use chat prompt
		// Only treat as first message if explicitly marked OR if there's truly no chat history
		const hasExistingHistory = data.chatHistory && data.chatHistory.length > 0;
		const isFirstMessage = data.isFirstMessage === true && !hasExistingHistory;
		const systemMessage = isFirstMessage
			? getFirstMessageSystemPrompt(data.projectContext)
			: getChatSystemPrompt(data.projectContext);

		const messages: Array<{
			role: "system" | "user" | "assistant";
			content: string;
		}> = [{ role: "system", content: systemMessage }];

		// Add chat history (last 10 messages)
		if (data.chatHistory) {
			for (const msg of data.chatHistory.slice(-10)) {
				messages.push({ role: msg.role, content: msg.content });
			}
		}

		messages.push({ role: "user", content: data.message });

		const response = await openai.chat.completions.create({
			model: "gpt-4o-2024-08-06",
			messages,
			response_format: {
				type: "json_schema",
				json_schema: {
					name: "chat_response",
					strict: true,
					schema: {
						type: "object",
						properties: {
							thinking: {
								type: "object",
								properties: {
									task: { type: "string" },
									context: { type: "string" },
									references: { type: "string" },
									evaluation: { type: "string" },
									iteration: { type: "string" },
								},
								required: [
									"task",
									"context",
									"references",
									"evaluation",
									"iteration",
								],
								additionalProperties: false,
							},
							message: { type: "string" },
							action: {
								type: "string",
								enum: ["generate", "modify", "none"],
							},
							graphData: {
								type: ["object", "null"],
								properties: {
									nodes: {
										type: "array",
										items: {
											type: "object",
											properties: {
												id: { type: "string" },
												type: {
													type: "string",
													enum: [
														"core-concept",
														"user-flow",
														"screen-ui",
														"condition",
														"feature",
														"custom-node",
													],
												},
												position: {
													type: "object",
													properties: {
														x: { type: "number" },
														y: { type: "number" },
													},
													required: ["x", "y"],
													additionalProperties: false,
												},
												data: {
													type: "object",
													properties: {
														label: { type: "string" },
														description: { type: ["string", "null"] },
														feasibility: {
															type: ["string", "null"],
															enum: ["green", "yellow", "red", null],
														},
														features: {
															type: ["array", "null"],
															items: {
																type: "object",
																properties: {
																	id: { type: "string" },
																	label: { type: "string" },
																},
																required: ["id", "label"],
																additionalProperties: false,
															},
														},
													},
													required: [
														"label",
														"description",
														"feasibility",
														"features",
													],
													additionalProperties: false,
												},
											},
											required: ["id", "type", "position", "data"],
											additionalProperties: false,
										},
									},
									edges: {
										type: "array",
										items: {
											type: "object",
											properties: {
												id: { type: "string" },
												source: { type: "string" },
												target: { type: "string" },
												label: { type: ["string", "null"] },
											},
											required: ["id", "source", "target", "label"],
											additionalProperties: false,
										},
									},
								},
								required: ["nodes", "edges"],
								additionalProperties: false,
							},
						},
						required: ["thinking", "message", "action", "graphData"],
						additionalProperties: false,
					},
				},
			},
			temperature: 0.7,
			max_tokens: 8000,
		});

		const content = response.choices[0].message.content;
		if (!content) throw new Error("No content returned");

		return JSON.parse(content);
	});

// Streaming chat function that returns thinking steps as they're detected
export const chatWithAIStreaming = createServerFn({ method: "POST" })
	.inputValidator(chatInputSchema)
	.handler(async ({ data }) => {
		const apiKey = process.env.OPENAI_API_KEY;
		if (!apiKey) {
			throw new Error("Missing OPENAI_API_KEY");
		}

		const openai = new OpenAI({ apiKey });

		// Use full system prompt for first message
		// Only treat as first message if explicitly marked OR if there's truly no chat history
		const hasExistingHistory = data.chatHistory && data.chatHistory.length > 0;
		const isFirstMessage = data.isFirstMessage === true && !hasExistingHistory;
		const systemMessage = isFirstMessage
			? getFirstMessageSystemPrompt(data.projectContext)
			: getChatSystemPrompt(data.projectContext);

		const messages: Array<{
			role: "system" | "user" | "assistant";
			content: string;
		}> = [{ role: "system", content: systemMessage }];

		if (data.chatHistory) {
			for (const msg of data.chatHistory.slice(-10)) {
				messages.push({ role: msg.role, content: msg.content });
			}
		}

		messages.push({ role: "user", content: data.message });

		// Use streaming to get real-time content
		const stream = await openai.chat.completions.create({
			model: "gpt-4o-2024-08-06",
			messages,
			stream: true,
			temperature: 0.7,
			max_tokens: 8000,
		});

		let fullContent = "";
		const thinkingSteps: {
			step: string;
			content: string;
			completed: boolean;
		}[] = [];
		const stepKeys = [
			"task",
			"context",
			"references",
			"evaluation",
			"iteration",
		];
		let currentStepIndex = -1;

		// Process the stream and detect thinking steps
		for await (const chunk of stream) {
			const delta = chunk.choices[0]?.delta?.content || "";
			fullContent += delta;

			// Detect which thinking step we're on based on JSON structure
			for (let i = currentStepIndex + 1; i < stepKeys.length; i++) {
				const key = stepKeys[i];
				const pattern = new RegExp(`"${key}"\\s*:\\s*"`);
				if (
					pattern.test(fullContent) &&
					!thinkingSteps.find((s) => s.step === key)
				) {
					// Mark previous step as completed
					if (currentStepIndex >= 0 && thinkingSteps[currentStepIndex]) {
						thinkingSteps[currentStepIndex].completed = true;
					}
					currentStepIndex = i;
					thinkingSteps.push({
						step: key,
						content: "",
						completed: false,
					});
				}
			}

			// Check if we've moved past the thinking section
			if (fullContent.includes('"message"')) {
				// Mark all thinking steps as completed
				for (const step of thinkingSteps) {
					step.completed = true;
				}
			}
		}

		// Parse the final JSON
		try {
			// Clean up the content if it has markdown code blocks
			let cleanContent = fullContent.trim();
			if (cleanContent.startsWith("```json")) {
				cleanContent = cleanContent.slice(7);
			}
			if (cleanContent.startsWith("```")) {
				cleanContent = cleanContent.slice(3);
			}
			if (cleanContent.endsWith("```")) {
				cleanContent = cleanContent.slice(0, -3);
			}
			cleanContent = cleanContent.trim();

			const parsed = JSON.parse(cleanContent);
			return {
				...parsed,
				streamingSteps: thinkingSteps,
			};
		} catch (error) {
			console.error("Failed to parse JSON:", error, fullContent);
			throw new Error("Failed to parse AI response as JSON");
		}
	});
