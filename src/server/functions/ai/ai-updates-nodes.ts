import OpenAI from "openai";
import { z } from "zod";

import type { Database, Json } from "@/lib/supabase-database.types";
import {
	buildChatMessages,
	createSupabaseClientFromEnv,
	extractJsonObject,
	parseJsonWithTrailingCommaFix,
	stripMarkdownCodeFence,
} from "@/server/utils";

// Server-side Supabase client
const getSupabaseClient = () => {
	return createSupabaseClientFromEnv();
};

// ══════════════════════════════════════════════════════════════════════════════
// Off-topic detection is now handled by the AI itself
// ══════════════════════════════════════════════════════════════════════════════

// ══════════════════════════════════════════════════════════════════════════════
// SHARED SYSTEM PROMPT - Same as generate-mind-map.ts
// ══════════════════════════════════════════════════════════════════════════════
export const mindMapSystemPrompt = `
You are an expert UX/product designer and technical architect. Your mission is to generate comprehensive, developer-friendly mind maps that break down app ideas into DEEP, DETAILED user flows.

⚠️ CRITICAL: OFF-TOPIC REQUEST DETECTION
═══════════════════════════════════════════════════════════════════════════════
BEFORE generating any mind map, you MUST determine if the user's request is related to app/product design and mind maps.

If the request is NOT related to:
- App/application design
- Product design
- User flows and screens
- Feature planning
- UI/UX design
- Website/platform design
- Mind map creation/modification

Then set "isOffTopic": true in your response and provide a helpful message explaining that you can only help with app/product design tasks.

Examples of OFF-TOPIC requests:
- Writing emails, poems, stories, essays
- General questions (weather, facts, trivia)
- Homework help unrelated to design
- Math problems or translations
- Recipes, cooking instructions
- Medical, legal, or financial advice
- Jokes or entertainment

Examples of ON-TOPIC requests:
- "Create a social media app"
- "Design a checkout flow for an e-commerce site"
- "Add a user profile feature"
- "Build a dashboard for analytics"
- "Create a login flow"

If isOffTopic is true, set action to "none" and graphData to null, but still provide a helpful message.

═══════════════════════════════════════════════════════════════════════════════
CORE PRINCIPLES - DEEP USER FLOW MAPPING
═══════════════════════════════════════════════════════════════════════════════

⚠️ CRITICAL: GO DEEP, NOT SHALLOW
- Every screen must detail WHAT the user sees and does
- Every form must list ALL fields using feature nodes
- Every decision point MUST have conditional logic
- Think step-by-step through the COMPLETE user journey
- Include error states, loading states, empty states

═══════════════════════════════════════════════════════════════════════════════
NODE TYPES (USE ONLY THESE)
═══════════════════════════════════════════════════════════════════════════════

1. "core-concept" - THE ROOT NODE ONLY
   - Position: ALWAYS {x: 0, y: 0}
   - The central app/product idea

2. "user-flow" - ENTRY POINT TO A MAJOR JOURNEY
   - Connects DIRECTLY to the root node
   - Represents a GOAL or TASK the user wants to accomplish
   - Should have a "description" explaining the journey

3. "feature" - FOR SCREENS AND FORM FIELDS (REPLACES screen-ui)
   ⚠️ USE THIS FOR ALL SCREENS AND UI ELEMENTS
   - Has "features" array listing UI elements, form fields, buttons
   - Can have "imageUrl" for screen mockups
   
   FOR FORMS - List EVERY field as a feature item:
   Example "Sign Up Form":
   {
     "type": "feature",
     "data": {
       "label": "Sign Up Form",
       "description": "User registration form with validation",
       "features": [
         {"id": "f1", "label": "Email Input (required, email validation)"},
         {"id": "f2", "label": "Password Input (min 8 chars, strength indicator)"},
         {"id": "f3", "label": "Confirm Password (must match)"},
         {"id": "f4", "label": "Full Name Input (required)"},
         {"id": "f5", "label": "Phone Number (optional, country code selector)"},
         {"id": "f6", "label": "Terms & Conditions Checkbox"},
         {"id": "f7", "label": "Marketing Emails Opt-in Checkbox"},
         {"id": "f8", "label": "Submit Button"},
         {"id": "f9", "label": "Google Sign Up Button"},
         {"id": "f10", "label": "Already have account? Link"}
       ]
     }
   }

4. "condition" - DECISION/BRANCHING POINTS
   ⚠️ MANDATORY FOR:
   - Authentication checks (logged in? valid credentials?)
   - Payment validation (card valid? sufficient funds?)
   - Form validation (all fields valid?)
   - Permission checks (is owner? can edit?)
   - State checks (has data? is empty?)
   
   ALWAYS creates 2 outgoing edges:
   - TRUE path (success/yes) → sourceHandle: "nodeId-true"
   - FALSE path (failure/no) → sourceHandle: "nodeId-false"

5. "custom-node" - TECHNICAL CONSIDERATIONS
   - Third-party integrations (Stripe, AWS, etc.)
   - Backend services
   - Email templates
   - Technical risks (use feasibility: "yellow" or "red")

═══════════════════════════════════════════════════════════════════════════════
CONDITIONAL LOGIC - REQUIRED FOR EVERY FLOW
═══════════════════════════════════════════════════════════════════════════════

⚠️ EVERY authentication flow MUST have:
- Condition: "Valid Credentials?" → TRUE: Dashboard, FALSE: Error
- Condition: "Account Exists?" → TRUE: Login, FALSE: Sign Up prompt
- Condition: "Email Verified?" → TRUE: Continue, FALSE: Verification screen

⚠️ EVERY payment flow MUST have:
- Condition: "Payment Method Added?" → TRUE: Process, FALSE: Add payment
- Condition: "Payment Successful?" → TRUE: Confirmation, FALSE: Error + retry
- Condition: "Sufficient Funds?" → TRUE: Process, FALSE: Error

⚠️ EVERY form submission MUST have:
- Condition: "Form Valid?" → TRUE: Submit, FALSE: Show errors
- Condition: "Submission Successful?" → TRUE: Success, FALSE: Error

═══════════════════════════════════════════════════════════════════════════════
POSITIONING RULES - SPREAD OUT TREE LAYOUT
═══════════════════════════════════════════════════════════════════════════════

⚠️ CRITICAL: Create a SPREAD OUT layout, not a single vertical column!

LAYOUT STRATEGY - RADIAL TREE:
1. Root node: {x: 0, y: 0}
2. User-flow nodes: Spread in a SEMI-CIRCLE below root at y = 300
3. Children spread OUTWARD and DOWNWARD from their parent
4. Siblings should be at DIFFERENT x positions, not stacked vertically

USER-FLOW POSITIONING (spread horizontally):
For N user-flows, distribute them in an arc:
- 2 flows: x = [-500, 500], y = 300
- 3 flows: x = [-700, 0, 700], y = 300
- 4 flows: x = [-900, -300, 300, 900], y = 300
- 5 flows: x = [-1000, -500, 0, 500, 1000], y = 300

CHILD NODE POSITIONING (spread like a tree):
When a user-flow has multiple children, spread them:
- First child: parent.x - 150, parent.y + 350
- Second child: parent.x + 150, parent.y + 350
- Third child: parent.x - 300, parent.y + 400
- Fourth child: parent.x + 300, parent.y + 400
- Fifth child: parent.x, parent.y + 450

STAGGER VERTICAL POSITIONS:
Don't put all nodes at the same y level. Vary them:
- Level 2 nodes: y between 300-400
- Level 3 nodes: y between 600-750
- Level 4 nodes: y between 950-1100
- Add ±50 variation to avoid straight lines

CONDITION NODE BRANCHING:
- TRUE path: parent.x - 250, parent.y + 300
- FALSE path: parent.x + 250, parent.y + 300
- Subsequent children continue spreading outward

EXAMPLE LAYOUT for Auth Flow with 4 children:
user-flow "Auth" at {x: -500, y: 300}
├── feature "Login Form" at {x: -650, y: 650}
├── feature "Sign Up Form" at {x: -350, y: 700}
├── condition "Valid?" at {x: -500, y: 1000}
│   ├── feature "Dashboard" at {x: -700, y: 1350} (TRUE)
│   └── feature "Error" at {x: -300, y: 1350} (FALSE)
└── custom "Email Service" at {x: -500, y: 1700}

═══════════════════════════════════════════════════════════════════════════════
EDGE RULES - CRITICAL
═══════════════════════════════════════════════════════════════════════════════

1. Every node (except root) MUST have an incoming edge
2. Root → user-flow edges: NO sourceHandle needed
3. Condition outgoing edges: MUST have sourceHandle ("nodeId-true" or "nodeId-false")
4. All edges should have descriptive labels

═══════════════════════════════════════════════════════════════════════════════
CONNECTIVITY RULES - NO ISOLATED NODES
═══════════════════════════════════════════════════════════════════════════════

⚠️ CRITICAL: The graph must be fully connected and follow a single flow.
- Every node must be reachable from the root through edges (no islands)
- Every non-terminal node MUST have at least one outgoing edge
- Terminal nodes (end states) must be explicitly labeled as end states
- Condition nodes MUST have BOTH TRUE and FALSE outgoing edges
- Do a final pass to verify there are zero orphan nodes

═══════════════════════════════════════════════════════════════════════════════
QUALITY CHECKLIST
═══════════════════════════════════════════════════════════════════════════════

□ Every form lists ALL fields in the features array
□ Every authentication point has a condition node
□ Every payment point has validation conditions
□ Error states are shown for all failure paths
□ Loading states are included for async operations
□ Empty states are considered
□ Edge labels describe user actions
□ All nodes are connected and reachable from the root (no isolated nodes)
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
CHAT MODE - FIRST MESSAGE INSTRUCTIONS
═══════════════════════════════════════════════════════════════════════════════

${
	projectContext && projectContext.nodes.length > 1
		? `⚠️ IMPORTANT: The user already has existing work on their canvas!

═══════════════════════════════════════════════════════════════════════════════
EXISTING CANVAS DATA (DO NOT REPLACE!)
═══════════════════════════════════════════════════════════════════════════════
Project: "${projectContext.title}"
Original Prompt: "${projectContext.prompt}"
Current Structure: ${projectContext.nodes.length} nodes, ${projectContext.edges.length} edges
Current Nodes: ${JSON.stringify(projectContext.nodes, null, 2)}
Current Edges: ${JSON.stringify(projectContext.edges, null, 2)}

STRATEGY FOR EXISTING CANVAS:
1. PRESERVE all existing nodes and edges exactly as they are
2. Create a NEW user-flow node as a parent for your AI-generated content
3. Position your new flow in an empty column (check existing x positions and use a new column)
4. Label your user-flow clearly (e.g., "AI: [User's Request]")
5. Connect your new flow to the existing root node

POSITION CALCULATION:
- Find the rightmost existing node's x position
- Add 700px to create your new column
- If no clear rightmost, use x = 1400 or higher

YOUR RESPONSE MUST:
- Include ALL existing nodes unchanged in the output
- Include ALL existing edges unchanged in the output
- ADD your new nodes with unique IDs (prefix with "ai_")
- ADD edges connecting your new content`
		: `The user is starting fresh with a new project. Create a complete mind map from scratch.`
}

YOUR RESPONSE FORMAT:

⚠️ CRITICAL: You MUST respond with VALID JSON ONLY. No markdown, no code blocks, no explanations outside the JSON structure!

Output ONLY this JSON structure (no other text before or after):

{
  "thinking": {
    "task": "What does the user want?",
    "context": "Domain knowledge and patterns",
    "references": "Apps/patterns I'm drawing from",
    "evaluation": "How this improves the design",
    "iteration": "Alternatives considered"
  },
  "message": "Your conversational response explaining what you created",
  "action": "generate",
  "graphData": {
    "nodes": [...], // Include ALL existing nodes + your new nodes
    "edges": [...]  // Include ALL existing edges + your new edges
  }
}

⚠️ DO NOT wrap in markdown code blocks (no \`\`\`json)
⚠️ DO NOT add any text before or after the JSON
⚠️ Output must be parseable JSON.parse() directly
`;

// Chat-specific system prompt for conversational AI (subsequent messages)
const getChatSystemPrompt = (projectContext?: {
	title: string;
	prompt: string;
	nodes: unknown[];
	edges: unknown[];
}) => `
You are an AI assistant helping users build and refine their mind map designs.

${mindMapSystemPrompt}

${
	projectContext
		? `═══════════════════════════════════════════════════════════════════════════════
CURRENT PROJECT CONTEXT (PRESERVE THIS!)
═══════════════════════════════════════════════════════════════════════════════
Project: "${projectContext.title}"
Original Prompt: "${projectContext.prompt}"
Current Structure: ${projectContext.nodes.length} nodes, ${projectContext.edges.length} edges
Current Nodes: ${JSON.stringify(projectContext.nodes, null, 2)}
Current Edges: ${JSON.stringify(projectContext.edges, null, 2)}

⚠️ CRITICAL: When modifying, you MUST include ALL existing nodes and edges in your output!
Only add, update, or remove what the user explicitly asks for.`
		: `No existing project - user is starting fresh.`
}

═══════════════════════════════════════════════════════════════════════════════
RESPONSE FORMAT - JSON ONLY!
═══════════════════════════════════════════════════════════════════════════════

⚠️ CRITICAL: You MUST respond with VALID JSON ONLY. No markdown, no code blocks, no explanations outside the JSON structure!

Output ONLY this JSON structure (no other text before or after):

{
  "thinking": {
    "task": "What does the user want?",
    "context": "Domain knowledge and patterns",
    "references": "Apps/patterns I'm drawing from",
    "evaluation": "How this improves the design",
    "iteration": "Alternatives considered"
  },
  "message": "Your conversational response explaining what you did",
  "action": "generate" | "modify" | "none",
  "graphData": {
    "nodes": [...],  // FULL list of nodes (existing + new/modified)
    "edges": [...]   // FULL list of edges (existing + new/modified)
  } | null
}

⚠️ DO NOT wrap in markdown code blocks (no \`\`\`json)
⚠️ DO NOT add any text before or after the JSON
⚠️ Output must be parseable JSON.parse() directly
⚠️ All strings must be properly escaped
⚠️ All arrays and objects must be properly formatted

ACTION TYPES:
- "generate": Create a complete mind map from scratch (for empty canvas or full rebuild)
- "modify": Update the existing mind map - ADD new nodes while PRESERVING existing ones
- "none": Just answering a question, no graph changes (set graphData to null)

WHEN USING "modify" ACTION:
1. Start with ALL existing nodes and edges exactly as they are
2. ADD new nodes with unique IDs (prefix with "ai_")
3. Position new content in an unused column (rightmost x + 700px)
4. Only REMOVE nodes if user explicitly asks
5. Only UPDATE node data if user explicitly asks to change something

POSITIONING NEW NODES:
1. Calculate: rightmost_x = max(existing node x positions)
2. New column: new_x = rightmost_x + 700
3. user-flow at y = 250, children increment by 350

FOR "none" ACTION:
- Set graphData to null
- Just provide a helpful message answering the question
`;

// Chat-specific server function for conversational AI
export const chatInputSchema = z.object({
	message: z.string().min(1),
	userId: z.string().optional(),
	projectId: z.string().optional(),
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

export type ChatInput = z.infer<typeof chatInputSchema>;

export async function chatWithAIHandler(data: ChatInput) {
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

	const messages = buildChatMessages(
		systemMessage,
		data.chatHistory,
		data.message,
	);

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
											sourceHandle: { type: ["string", "null"] },
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
}

// Streaming chat function that returns thinking steps as they're detected

export async function chatWithAIStreamingHandler(data: ChatInput) {
	const apiKey = process.env.OPENAI_API_KEY;
	if (!apiKey) {
		throw new Error("Missing OPENAI_API_KEY");
	}

	// Off-topic detection is now handled by the AI itself

	const supabase = getSupabaseClient();

	// Save user message to database (backend)
	if (data.userId && data.projectId) {
		const userMessage: Database["public"]["Tables"]["chat_messages"]["Insert"] =
			{
				mind_map_id: data.projectId,
				user_id: data.userId,
				role: "user",
				content: data.message,
			};
		const { error: userMessageError } = await supabase
			.from("chat_messages")
			.insert(userMessage as never);

		if (userMessageError) {
			console.error("Error saving user message:", userMessageError);
			// Don't fail the request, but log the error
		}
	}

	// Check credits before generation (only if user is authenticated)
	if (data.userId) {
		// Check user's credits
		const { data: userCreditsRaw, error: creditsError } = await supabase
			.from("user_credits")
			.select("credits")
			.eq("user_id", data.userId)
			.single();

		let userCredits = userCreditsRaw as { credits: number } | null;

		if (creditsError && creditsError.code !== "PGRST116") {
			console.error("Error checking credits:", creditsError);
			throw new Error("Failed to check credits");
		}

		// If user exists but has no credits record, create one with default
		if (creditsError?.code === "PGRST116") {
			const { data: initializedCredits, error: initError } = await supabase.rpc(
				"initialize_user_credits",
				{
					p_user_id: data.userId,
				} as never,
			);

			if (initError) {
				console.error("Error creating credits:", initError);
				throw new Error("Failed to initialize credits");
			}

			// Update userCredits with the initialized data
			const initializedList = initializedCredits as
				| { credits: number }[]
				| null;
			if (initializedList && initializedList.length > 0) {
				userCredits = {
					credits: initializedList[0].credits,
				};
			}
		}

		// Check if user has enough credits (1 credit per generation)
		if (!userCredits || userCredits.credits < 1) {
			throw new Error("INSUFFICIENT_CREDITS");
		}
	}

	const openai = new OpenAI({ apiKey });

	// Use full system prompt for first message
	// Only treat as first message if explicitly marked OR if there's truly no chat history
	const hasExistingHistory = data.chatHistory && data.chatHistory.length > 0;
	const isFirstMessage = data.isFirstMessage === true && !hasExistingHistory;
	const systemMessage = isFirstMessage
		? getFirstMessageSystemPrompt(data.projectContext)
		: getChatSystemPrompt(data.projectContext);

	const messages = buildChatMessages(
		systemMessage,
		data.chatHistory,
		data.message,
	);

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
	const stepKeys = ["task", "context", "references", "evaluation", "iteration"];
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
		const cleanContent = stripMarkdownCodeFence(fullContent);
		let jsonContent = extractJsonObject(cleanContent);

		type ParsedResponse = {
			isOffTopic?: boolean;
			thinking: {
				task: string;
				context: string;
				references: string;
				evaluation: string;
				iteration: string;
			};
			message: string;
			action: "generate" | "modify" | "none";
			graphData: {
				nodes: Array<Record<string, unknown>>;
				edges: Array<Record<string, unknown>>;
			} | null;
			streamingSteps?: Array<{
				step: string;
				content: string;
				completed: boolean;
			}>;
		};

		let parsed: ParsedResponse;
		try {
			parsed = parseJsonWithTrailingCommaFix<ParsedResponse>(jsonContent);
		} catch (retryError) {
			console.error("Failed to parse JSON:", retryError);
			console.error("Content received:", fullContent.substring(0, 500));
			throw new Error(
				"Invalid JSON response from AI. Please try again or rephrase your request.",
			);
		}

		// Validate required fields
		if (!parsed.thinking || !parsed.message || !parsed.action) {
			throw new Error(
				"Invalid response structure. Missing required fields: thinking, message, or action.",
			);
		}

		// Ensure graphData is null if action is "none"
		if (parsed.action === "none" && parsed.graphData !== null) {
			parsed.graphData = null;
		}

		// Deduct credits only if action is generate or modify (not for "none" - just answering questions)
		if (
			data.userId &&
			(parsed.action === "generate" || parsed.action === "modify")
		) {
			const supabase = getSupabaseClient();

			// Deduct 1 credit for this generation using RPC function
			const { error: deductError } = await supabase.rpc("deduct_credits", {
				p_user_id: data.userId,
				p_amount: 1,
				p_description: `AI chat - ${parsed.action} action`,
			} as never);

			// If RPC doesn't exist or fails, log error but don't fail the request
			if (deductError) {
				console.error("Error deducting credits:", deductError);
			}

			// Save first_prompt if this is the first message OR if project doesn't have one yet
			if (
				data.projectId &&
				(data.isFirstMessage || parsed.action === "generate")
			) {
				// First check if project already has a first_prompt
				const { data: existingProjectRaw, error: fetchError } = await supabase
					.from("mind_maps")
					.select("first_prompt")
					.eq("id", data.projectId)
					.eq("user_id", data.userId)
					.single();

				if (fetchError) {
					console.error("Error fetching project:", fetchError);
				}

				const existingProject = existingProjectRaw as {
					first_prompt: string | null;
				} | null;

				// Check if first_prompt is empty, null, or doesn't exist
				const firstPrompt = existingProject?.first_prompt;
				const shouldSavePrompt =
					!existingProject ||
					!firstPrompt ||
					(typeof firstPrompt === "string" && firstPrompt.trim() === "");

				if (shouldSavePrompt) {
					const updateData: Database["public"]["Tables"]["mind_maps"]["Update"] =
						{
							first_prompt: data.message,
							updated_at: new Date().toISOString(),
						};
					const { error: updateError } = await supabase
						.from("mind_maps")
						.update(updateData as never)
						.eq("id", data.projectId)
						.eq("user_id", data.userId);

					if (updateError) {
						console.error("Error saving first_prompt:", updateError);
					} else {
						console.log(
							"first_prompt saved successfully:",
							`${data.message.substring(0, 50)}...`,
						);
					}
				} else {
					const existingPrompt = existingProject?.first_prompt;
					console.log(
						"first_prompt already exists, skipping save:",
						typeof existingPrompt === "string"
							? `${existingPrompt.substring(0, 50)}...`
							: "null/undefined",
					);
				}
			}

			// Save AI response to database (backend)
			if (data.userId && data.projectId) {
				const aiMessage: Database["public"]["Tables"]["chat_messages"]["Insert"] =
					{
						mind_map_id: data.projectId,
						user_id: data.userId,
						role: "ai",
						content: parsed.message,
						...(parsed.action === "generate" || parsed.action === "modify"
							? { map_data: parsed.graphData as Json }
							: {}),
					};
				const { error: aiMessageError } = await supabase
					.from("chat_messages")
					.insert(aiMessage as never);

				if (aiMessageError) {
					console.error("Error saving AI message:", aiMessageError);
					// Don't fail the request, but log the error
				}
			}
		}

		// Type assertion needed due to Record<string, unknown> vs { [x: string]: {} } incompatibility
		// The actual runtime structure is correct
		return {
			...parsed,
			streamingSteps: thinkingSteps,
		} as unknown as {
			thinking: {
				task: string;
				context: string;
				references: string;
				evaluation: string;
				iteration: string;
			};
			message: string;
			action: "generate" | "modify" | "none";
			graphData: {
				nodes: Array<Record<string, unknown>>;
				edges: Array<Record<string, unknown>>;
			} | null;
			streamingSteps: Array<{
				step: string;
				content: string;
				completed: boolean;
			}>;
		};
	} catch (error) {
		console.error("Failed to parse JSON:", error, fullContent);
		// Re-throw insufficient credits error
		if (error instanceof Error && error.message === "INSUFFICIENT_CREDITS") {
			throw error;
		}
		throw new Error("Failed to parse AI response as JSON");
	}
}
