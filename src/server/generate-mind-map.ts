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
});

export const generateMindMap = createServerFn({ method: "POST" })
	.inputValidator(generateMindMapInputSchema)
	.handler(async ({ data }) => {
		const apiKey = process.env.OPENAI_API_KEY;

		if (!apiKey) {
			throw new Error("Missing OPENAI_API_KEY in environment variables");
		}

		const openai = new OpenAI({ apiKey });

		// ── Modern, flow-focused system prompt ─────────────────────────────────────
		const systemPrompt = `
You are an expert UX/product designer. Given an app description, generate a DETAILED mind map that walks through the ACTUAL USER JOURNEY screen-by-screen.

**CRITICAL RULES:**
1. DO NOT create abstract category nodes. Instead, create ACTUAL SCREENS the user will see.
2. Each screen node should list its UI elements/form fields in the "features" array.
3. Use "decision" nodes for branching points in the user flow.
4. Think step-by-step: What does the user see first? What do they click? What happens next?

Output strictly valid JSON (no markdown, no code blocks):

{
  "nodes": [
    {
      "id": string,
      "type": "core-concept" | "user-flow" | "screen" | "decision" | "feature" | "risk" | "custom-node",
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
NODE TYPE GUIDELINES:
═══════════════════════════════════════════════════════════════════════════════

1. "core-concept": ONLY the central root node (app name/main idea). No features array.

2. "user-flow": Entry point to a user journey (e.g., "Authentication Flow", "Posting Flow").
   - Connect directly to root
   - Use description to explain the journey
   - NO features array on user-flow nodes - expand into screen nodes instead

3. "screen": ACTUAL UI SCREENS with their elements listed in features array.
   Examples:
   - "Login Screen" → features: [Email Input, Password Input, Remember Me, Login Button, Forgot Password Link, Sign Up Link]
   - "Sign Up Screen" → features: [Username Input, Email Input, Password Input, Confirm Password, Terms Checkbox, Create Account Button]
   - "Compose Tweet Modal" → features: [Text Area (280 chars), Add Image Button, Add GIF Button, Add Poll Button, Schedule Button, Tweet Button]
   - "Profile Page" → features: [Avatar, Cover Photo, Bio, Follow/Unfollow Button, Followers Count, Following Count, Tweet Tab, Replies Tab, Likes Tab]
   - "Home Feed" → features: [For You Tab, Following Tab, Tweet Cards, Pull to Refresh, Infinite Scroll]

4. "decision": Branching point where user makes a choice. Creates multiple paths.
   Examples:
   - "New or Returning User?" → edges to "Login Screen" and "Sign Up Screen"
   - "Post Type?" → edges to "Text Post", "Media Post", "Poll"
   Use edge labels like "New User", "Returning", "With Media", "Text Only"

5. "feature": Standalone feature node (use sparingly). Can have its own features array for sub-features.

6. "risk": Technical challenges. Set feasibility: "yellow" or "red"

═══════════════════════════════════════════════════════════════════════════════
POSITIONING RULES:
═══════════════════════════════════════════════════════════════════════════════
- Root node: {x: 0, y: 0}
- Main branches (user-flow): spread radially, 450px from center
  - 4 branches: (-450, -300), (450, -300), (-450, 350), (450, 350)
  - 5 branches: (-450, -300), (450, -300), (-550, 150), (550, 150), (0, 450)
  - 6 branches: (-450, -300), (450, -300), (-550, 100), (550, 100), (-450, 450), (450, 450)
- Child nodes: stack vertically below parent with 250px spacing
  - Keep same x-coordinate as parent
  - First child: parent.y + 250
  - Second child: parent.y + 500, etc.
- Minimum 350px horizontal gap between branches

═══════════════════════════════════════════════════════════════════════════════
EXAMPLE: Twitter Clone (Detailed)
═══════════════════════════════════════════════════════════════════════════════

Root: "Twitter Clone" (core-concept, x:0, y:0)

├── "Authentication Flow" (user-flow, x:-450, y:-300)
│   description: "User login and registration journey"
│   │
│   └── "New or Returning?" (decision, x:-450, y:-50)
│       ├── "Login Screen" (screen, x:-600, y:200)
│       │   features: [Email/Username Input, Password Input, Remember Me Toggle, Login Button, Forgot Password Link, Sign Up Link, OAuth Buttons]
│       │   │
│       │   └── "Forgot Password" (screen, x:-600, y:450)
│       │       features: [Email Input, Send Reset Link Button, Back to Login]
│       │
│       └── "Sign Up Screen" (screen, x:-300, y:200)
│           features: [Display Name Input, Email Input, Password Input, Date of Birth, Create Account Button, Terms Link]
│           │
│           └── "Onboarding" (screen, x:-300, y:450)
│               features: [Profile Photo Upload, Bio Input, Interests Selection, Follow Suggestions, Skip Button, Continue Button]

├── "Home & Feed" (user-flow, x:450, y:-300)
│   description: "Main content consumption experience"
│   │
│   └── "Home Feed" (screen, x:450, y:-50)
│       features: [For You Tab, Following Tab, Tweet Cards, Pull to Refresh, Floating Compose Button]
│       │
│       └── "Tweet Detail" (screen, x:450, y:200)
│           features: [Original Tweet, Reply Thread, Like Button, Retweet Button, Reply Input, Share Button]

├── "Compose Flow" (user-flow, x:-550, y:150)
│   description: "Creating and publishing content"
│   │
│   └── "Compose Modal" (screen, x:-550, y:400)
│       features: [Text Input (280 chars), Character Counter, Add Image, Add GIF, Add Poll, Add Location, Audience Selector, Tweet Button]

├── "Profile & Settings" (user-flow, x:550, y:150)
│   description: "User profile management"
│   │
│   └── "Profile Page" (screen, x:550, y:400)
│       features: [Cover Photo, Avatar, Display Name, Username, Bio, Location, Join Date, Followers/Following Counts, Tweets Tab, Replies Tab, Media Tab, Likes Tab]

├── "Search & Explore" (user-flow, x:-450, y:450)
│   description: "Content discovery"
│   │
│   └── "Explore Page" (screen, x:-450, y:700)
│       features: [Search Bar, Trending Topics, News Section, For You Suggestions, Category Tabs]

└── "Notifications" (user-flow, x:450, y:450)
    description: "Activity and engagement alerts"
    │
    └── "Notifications Screen" (screen, x:450, y:700)
        features: [All Tab, Mentions Tab, Like Notifications, Retweet Notifications, Follow Notifications, Reply Notifications]

═══════════════════════════════════════════════════════════════════════════════
KEY RULES:
═══════════════════════════════════════════════════════════════════════════════
- Generate 15-25 nodes for a comprehensive map
- Every user-flow MUST expand into at least one screen node
- Screen nodes MUST have 4-8 features (actual UI elements)
- Use decision nodes for meaningful branching (login vs signup, post types, etc.)
- Features are UI ELEMENTS: inputs, buttons, tabs, sections - NOT abstract concepts
- Connect screens in logical user flow order with edges
- Edge labels should describe the action: "clicks", "submits", "selects", "if new user", etc.
    `;

		// Define JSON Schema for Structured Outputs (much more reliable than json_object mode)
		const jsonSchema = {
			name: "mind_map_graph",
			strict: true,
			schema: {
				type: "object",
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
										"screen",
										"decision",
										"feature",
										"risk",
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
				required: ["nodes", "edges"],
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

			// Optional: Save to Supabase
			const supabase = getSupabaseClient();
			const { error: dbError } = await supabase.from("mind_maps").insert({
				prompt: data.prompt,
				graph_data: graphData,
				created_at: new Date().toISOString(),
			});

			if (dbError) {
				console.error("Supabase insert error:", dbError);
				// Still return the graph — don't fail the whole request
			}

			return graphData;
		} catch (error) {
			console.error("Error in generateMindMap:", error);
			throw error;
		}
	});
