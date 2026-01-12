import { createClient } from "@supabase/supabase-js";
import { createServerFn } from "@tanstack/react-start";
import OpenAI from "openai";
import { z } from "zod";

// Server-side Supabase client
const getSupabaseClient = () => {
	const supabaseUrl = process.env.VITE_SUPABASE_URL || "";
	const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || "";
	return createClient(supabaseUrl, supabaseAnonKey);
};

const generateMindMapInputSchema = z.object({
	prompt: z.string().min(1, "Prompt is required"),
	userId: z.string().optional(),
	projectId: z.string().optional(),
	title: z.string().optional(),
});

export const generateMindMap = createServerFn({ method: "POST" })
	.inputValidator(generateMindMapInputSchema)
	.handler(async ({ data }) => {
		const apiKey = process.env.OPENAI_API_KEY;

		if (!apiKey) {
			throw new Error("Missing OPENAI_API_KEY in environment variables");
		}

		const openai = new OpenAI({ apiKey });

		// ── 5-Step Process System Prompt with Chain-of-Thought & Tree-of-Thoughts ─────
		const systemPrompt = `
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

If the user's prompt lacks detail, mentally "search" for best practices:
- Think: "What would a user expect from a [type] app based on market leaders?"
- Think: "What are the must-have features vs nice-to-haves?"
- Think: "What onboarding patterns work best for this domain?"

┌─────────────────────────────────────────────────────────────────────────────┐
│ STEP 3: REFERENCES - Map to Established Patterns                            │
└─────────────────────────────────────────────────────────────────────────────┘
- Identify 3-5 reference apps/patterns you're drawing from
- For each user flow, cite WHY you structured it that way
- Example: "The checkout flow follows Amazon's 1-click pattern because..."
- Example: "Onboarding uses progressive disclosure like Duolingo because..."

Document your references:
- "Auth flow: Inspired by [App] - [reason]"
- "Core loop: Based on [Pattern] - [why it fits]"
- "Edge case handling: Learned from [App's] approach to [problem]"

┌─────────────────────────────────────────────────────────────────────────────┐
│ STEP 4: EVALUATE - Assess Developer-Friendliness                            │
└─────────────────────────────────────────────────────────────────────────────┘
Before finalizing, evaluate your output against these criteria:

FOR BEGINNER DEVELOPERS (Junior/Bootcamp grads):
✓ Can they understand the flow by reading node labels alone?
✓ Are technical terms explained in descriptions?
✓ Is the progression logical (no jumping between unrelated concepts)?
✓ Are edge cases clearly marked as separate branches?

FOR INTERMEDIATE DEVELOPERS (1-3 years experience):
✓ Are the screen-ui nodes detailed enough to start wireframing?
✓ Are condition nodes capturing real business logic?
✓ Are technical risks (custom-nodes) realistic and actionable?
✓ Could they estimate development time from this map?

CLARITY CHECKLIST:
□ Every node label is self-explanatory (no jargon without context)
□ Every edge label explains the USER ACTION or SYSTEM EVENT that triggers it
□ Descriptions add value (not just repeating the label)
□ Feature lists are specific enough to implement

┌─────────────────────────────────────────────────────────────────────────────┐
│ STEP 5: ITERATE - Refine Using Tree-of-Thoughts                             │
└─────────────────────────────────────────────────────────────────────────────┘
For each major flow, explore multiple approaches before committing:

EXPLORATION FORMAT:
"For [Flow Name], I considered:
  Option A: [Approach] 
    ✓ Pros: [benefits]
    ✗ Cons: [drawbacks]
  Option B: [Approach]
    ✓ Pros: [benefits]  
    ✗ Cons: [drawbacks]
  → Chosen: [Option] because [justification]"

BACKTRACKING:
If a path doesn't work, document it:
"Initially considered [approach] but discarded because [reason]. 
 Pivoted to [new approach] which better handles [specific case]."

═══════════════════════════════════════════════════════════════════════════════
CHAIN-OF-THOUGHT: MANDATORY REASONING STRUCTURE
═══════════════════════════════════════════════════════════════════════════════

Your "reasoning" field MUST follow this structure:

1. TASK UNDERSTANDING
   - Restate the app idea in your own words
   - List assumptions made for vague requirements
   - Define scope boundaries

2. CONTEXT ANALYSIS  
   - App category and domain patterns
   - Target user persona (brief)
   - Technical landscape in 2026

3. REFERENCE MAPPING
   - List 3-5 reference apps/patterns
   - Explain how each influenced your design

4. USER JOURNEY IDENTIFICATION
   - List ALL major user journeys (not features!)
   - For each journey, outline: Entry → Steps → Branches → Exit
   - Consider the full user lifecycle:
     * First-time user experience
     * Core value loop (what keeps them coming back)
     * Power user paths
     * Error/edge case handling
     * Exit/churn scenarios

5. TREE-OF-THOUGHTS EXPLORATION
   For each major decision point:
   - Generate 2-4 structural options
   - Evaluate pros/cons
   - Justify final choice
   - Note any discarded approaches

6. DEVELOPER-FRIENDLINESS EVALUATION
   - How would a junior dev interpret this?
   - What might confuse an intermediate dev?
   - Final clarity adjustments made

7. LAYOUT PLANNING
   - Number of main flows → column assignments
   - Depth of each flow → vertical space needed
   - Branch points → sub-column offsets

═══════════════════════════════════════════════════════════════════════════════
OUTPUT FORMAT
═══════════════════════════════════════════════════════════════════════════════

Output strictly valid JSON (no markdown, no code blocks):

{
  "reasoning": "Your complete 5-step thought process here (detailed, transparent)",
  "nodes": [
    {
      "id": string,
      "type": "core-concept" | "user-flow" | "screen-ui" | "condition" | "feature" | "custom-node",
      "position": { "x": number, "y": number },
      "data": {
        "label": string,
        "description"?: string,
        "feasibility"?: "green" | "yellow" | "red",
        "features"?: [{id: string, label: string}]
      }
    }
  ],
  "edges": [
    { "id": string, "source": string, "target": string, "label"?: string }
  ]
}

═══════════════════════════════════════════════════════════════════════════════
NODE TYPES - USE ONLY THESE (NO CUSTOM TYPES!)
═══════════════════════════════════════════════════════════════════════════════

1. "core-concept" - THE ROOT NODE ONLY
   - The central app/product idea
   - Position: ALWAYS {x: 0, y: 0}
   - Example: "Twitter Clone", "E-Commerce App"

2. "user-flow" - ENTRY POINT TO A MAJOR JOURNEY
   ⚠️ WHEN TO USE: A high-level category that groups related screens/features
   - Connects DIRECTLY to the root node
   - Represents a GOAL or TASK the user wants to accomplish
   - Should have a "description" explaining the journey clearly
   - Does NOT have features array (screens have that)
   
   ✅ GOOD EXAMPLES:
   - "Authentication Flow" - goal: get user logged in
   - "Checkout Flow" - goal: complete a purchase
   - "Content Creation" - goal: create and publish content
   - "Profile Management" - goal: manage user profile
   - "Discovery & Search" - goal: find content/products
   
   ❌ NOT A USER-FLOW (these are screens or features):
   - "Login Screen" - this is a SCREEN within auth flow
   - "Tweet Actions" - this is a FEATURE group
   - "Shopping Cart" - this is a SCREEN

3. "screen-ui" - ACTUAL UI SCREENS THE USER SEES
   ⚠️ WHEN TO USE: A distinct page, modal, or view the user interacts with
   - Has a UNIQUE URL or is a distinct modal/sheet
   - User can navigate TO this screen
   - MUST have "features" array listing UI elements on that screen
   
   ✅ GOOD EXAMPLES:
   - "Login Screen" - distinct page with form elements
   - "Home Feed" - main content page
   - "Product Detail Page" - shows one product
   - "Settings Modal" - overlay with settings
   - "Compose Tweet Modal" - modal for creating content
   
   FEATURES ARRAY: List specific UI elements (be thorough!):
   - Form inputs (Email Input, Password Field, Search Box)
   - Buttons (Submit Button, Cancel Button, Add to Cart)
   - Interactive elements (Tabs, Toggles, Sliders)
   - Content sections (Header, Hero Banner, Reviews Section)
   - Navigation (Back Button, Tab Bar, Sidebar)

4. "condition" - DECISION/BRANCHING POINTS
   ⚠️ WHEN TO USE: User or system makes a choice that leads to different paths
   - Creates 2+ outgoing edges with labels describing each path
   - Represents IF/ELSE logic in the user journey
   - Diamond shape in the UI
   
   ✅ GOOD EXAMPLES:
   - "New or Returning User?" → "New User" to signup, "Returning" to login
   - "Payment Method?" → "Credit Card", "PayPal", "Apple Pay"
   - "Has Account?" → "Yes" to dashboard, "No" to onboarding
   - "Post Type?" → "Text", "Image", "Video", "Poll"

5. "feature" - GROUPED CAPABILITIES/ACTIONS
   ⚠️ WHEN TO USE: A collection of related actions or capabilities
   - NOT a screen, but actions available within screens
   - Has "features" array listing the individual capabilities
   - Think of it as "things you can DO" not "places you can GO"
   
   ✅ GOOD EXAMPLES:
   - "Tweet Actions" → [Like, Retweet, Quote, Reply, Bookmark, Share]
   - "Media Upload" → [Photo, Video, GIF, Camera, Filters, Crop]
   - "Payment Methods" → [Credit Card, PayPal, Apple Pay, Crypto]
   - "Notification Settings" → [Push, Email, SMS, In-App]
   
   ❌ NOT A FEATURE GROUP (these are screens):
   - "Profile Page" - this is a SCREEN
   - "Settings Page" - this is a SCREEN

6. "custom-node" - TECHNICAL/MISC NODES
   - Technical risks (use "feasibility": "yellow" or "red")
   - Third-party integrations
   - Backend considerations
   - Anything that doesn't fit above
   
   ✅ EXAMPLES:
   - "Real-time Sync" (feasibility: "yellow") - "WebSocket infrastructure needed"
   - "AI Moderation" (feasibility: "red") - "Complex ML pipeline"
   - "Stripe Integration" - "Payment processing"
   - "Analytics" - "User behavior tracking"

═══════════════════════════════════════════════════════════════════════════════
POSITIONING RULES - PREVENT OVERLAP!
═══════════════════════════════════════════════════════════════════════════════

⚠️ CRITICAL: Each flow branch should occupy its own COLUMN. Do not mix nodes from different flows!

LAYOUT STRATEGY - COLUMN-BASED:
1. Root node: {x: 0, y: 0}
2. Each user-flow gets its own COLUMN, spaced 700px apart horizontally
3. Within a column, nodes flow DOWNWARD, spaced 350px apart vertically
4. Condition nodes split into sub-columns within the parent column

COLUMN ASSIGNMENTS (scale based on number of user-flows):
- 3 flows: x = -700, 0, 700
- 4 flows: x = -1050, -350, 350, 1050
- 5 flows: x = -1400, -700, 0, 700, 1400
- 6 flows: x = -1750, -1050, -350, 350, 1050, 1750
- 7+ flows: Continue pattern, spacing 700px apart, centered around 0

VERTICAL SPACING within each column:
- user-flow node: y = 250 (first level below root)
- First child: y = 600
- Second child: y = 950
- Third child: y = 1300
- Continue adding 350 for each level (no limit!)

CONDITION NODE BRANCHING:
- When a condition splits paths, offset children horizontally by ±200px
- Left path: parent.x - 200
- Right path: parent.x + 200
- For 3+ branches: spread evenly (e.g., -200, 0, +200)
- Keep same y-level for siblings from same condition

DEEP FLOWS (many steps):
- If a flow has 10+ nodes vertically, that's fine - keep going!
- Just maintain consistent 350px vertical spacing
- The mind map should be as detailed as needed to fully capture the user journey

═══════════════════════════════════════════════════════════════════════════════
STEP-BY-STEP USER FLOW STRUCTURE
═══════════════════════════════════════════════════════════════════════════════

Each user flow should tell a COMPLETE STORY. Structure them as:

1. ENTRY POINT (user-flow node)
   ↓
2. INITIAL SCREEN (screen-ui) - What the user sees first
   ↓
3. DECISION POINT (condition) - If there are branches
   ↓ ↘
4a. PATH A              4b. PATH B
   ↓                       ↓
5a. NEXT SCREEN         5b. ALTERNATE SCREEN
   ↓                       ↓
6. ACTIONS AVAILABLE (feature) - What they can do
   ↓
7. SUCCESS/COMPLETION SCREEN (screen-ui)
   ↓
8. ERROR HANDLING / EDGE CASES (condition → screens)
   ↓
9. TECHNICAL CONSIDERATIONS (custom-node) - If relevant

NO ARBITRARY LIMITS: 
- Include as many nodes as needed to fully represent the flow
- A simple flow might have 5 nodes; a complex one might have 20+
- The goal is CLARITY and COMPLETENESS, not brevity

═══════════════════════════════════════════════════════════════════════════════
QUALITY STANDARDS FOR DEVELOPER-FRIENDLY OUTPUT
═══════════════════════════════════════════════════════════════════════════════

LABELS should be:
✓ Action-oriented for flows ("Complete Purchase" not "Purchase")
✓ Noun-based for screens ("Shopping Cart" not "View Cart")
✓ Question-form for conditions ("Has Payment Method?" not "Payment Check")

DESCRIPTIONS should:
✓ Add context not obvious from the label
✓ Include relevant user state ("User arrives here after...")
✓ Note technical requirements for custom-nodes
✓ Be written for someone who hasn't seen the app

FEATURES should:
✓ Be specific UI elements, not abstract concepts
✓ Include interaction type when relevant ("Tap to...", "Swipe to...")
✓ Cover happy path AND error states
✓ List in logical top-to-bottom or left-to-right order

EDGES should:
✓ Have labels that describe the USER ACTION or TRIGGER
✓ Use present tense ("Clicks Submit" not "Clicked Submit")
✓ Be specific ("Selects Credit Card" not "Continues")

═══════════════════════════════════════════════════════════════════════════════
FINAL CHECKLIST (Verify Before Output)
═══════════════════════════════════════════════════════════════════════════════

□ "reasoning" field contains complete 5-step thought process
□ All 6 node types used correctly (no custom types invented!)
□ Root node is "core-concept" at {x:0, y:0}
□ User-flows connect directly to root
□ All screens use type "screen-ui" (NOT "screen")
□ All decisions use type "condition" (NOT "decision")  
□ All risks use type "custom-node" (NOT "risk")
□ Each flow is in its own column (700px horizontal spacing)
□ Vertical spacing is 350px between levels
□ No nodes overlap
□ All edges have valid source/target IDs
□ A junior developer could understand the flow
□ An intermediate developer could start implementing from this
□ No arbitrary node limits - map is as detailed as needed
    `;

		// Define JSON Schema for Structured Outputs with reasoning field
		const jsonSchema = {
			name: "mind_map_graph",
			strict: true,
			schema: {
				type: "object",
				properties: {
					reasoning: {
						type: "string",
						description:
							"Complete 5-step thought process: Task understanding, Context analysis, Reference mapping, Evaluation, and Tree-of-Thoughts iteration",
					},
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
									properties: { x: { type: "number" }, y: { type: "number" } },
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
									required: ["label", "description", "feasibility", "features"],
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
				required: ["reasoning", "nodes", "edges"],
				additionalProperties: false,
			},
		};

		try {
			const response = await openai.chat.completions.create({
				model: "gpt-4o-2024-08-06", // ← Reliable 2026 choice; upgrade to gpt-4.1 / gpt-5.1 if you want
				messages: [
					{ role: "system", content: systemPrompt },
					{ role: "user", content: data.prompt },
				],
				response_format: {
					type: "json_schema",
					json_schema: jsonSchema,
				},
				temperature: 0.7,
				max_tokens: 8000,
			});

			const content = response.choices[0].message.content;
			if (!content) throw new Error("No content returned from OpenAI");

			const graphData = JSON.parse(content);

			// Save to user's project if authenticated
			if (data.userId) {
				const supabase = getSupabaseClient();

				if (data.projectId) {
					// Update existing project
					const { error: updateError } = await supabase
						.from("mind_map_projects")
						.update({
							graph_data: graphData,
							updated_at: new Date().toISOString(),
						})
						.eq("id", data.projectId)
						.eq("user_id", data.userId);

					if (updateError) {
						console.error("Supabase update error:", updateError);
					}
				} else {
					// Create new project
					const title = data.title || extractTitle(data.prompt);
					const { data: newProject, error: insertError } = await supabase
						.from("mind_map_projects")
						.insert({
							user_id: data.userId,
							title,
							description: data.prompt.slice(0, 200),
							prompt: data.prompt,
							graph_data: graphData,
						})
						.select()
						.single();

					if (insertError) {
						console.error("Supabase insert error:", insertError);
					} else {
						// Return the project ID so client can track it
						return { ...graphData, projectId: newProject.id };
					}
				}
			}

			return graphData;
		} catch (error) {
			console.error("Error in generateMindMap:", error);
			throw error;
		}
	});

// Helper to extract a title from the prompt
function extractTitle(prompt: string): string {
	// Take first sentence or first 50 chars
	const firstSentence = prompt.split(/[.!?]/)[0];
	if (firstSentence.length <= 50) return firstSentence.trim();
	return `${prompt.slice(0, 47).trim()}...`;
}
