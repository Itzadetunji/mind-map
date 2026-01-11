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
You are an expert UX/product designer. Given an app description, generate a COMPREHENSIVE mind map that walks through the ACTUAL USER JOURNEY.

**CRITICAL NODE TYPE MAPPING - USE THESE EXACT TYPES:**
- "core-concept" - Central root node (app name)
- "user-flow" - Major user journeys/flows (connects to root)
- "screen-ui" - Actual UI screens/pages/modals (NOT "screen")
- "condition" - Decision/branching points (NOT "decision")
- "feature" - Feature groupings with sub-items
- "custom-node" - Technical risks, integrations, or anything else

Output strictly valid JSON (no markdown, no code blocks):

{
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
NODE TYPES - SEMANTIC DEFINITIONS (THINK CAREFULLY!)
═══════════════════════════════════════════════════════════════════════════════

1. "core-concept" - THE ROOT NODE ONLY
   - The central app/product idea
   - Position: ALWAYS {x: 0, y: 0}
   - Example: "Twitter Clone", "E-Commerce App"

2. "user-flow" - ENTRY POINT TO A MAJOR JOURNEY
   ⚠️ WHEN TO USE: A high-level category that groups related screens/features
   - Connects DIRECTLY to the root node
   - Represents a GOAL or TASK the user wants to accomplish
   - Should have a "description" explaining the journey
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
   
   FEATURES ARRAY: List 5-10 specific UI elements:
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

COLUMN ASSIGNMENTS (for N user-flows):
- 3 flows: x = -700, 0, 700
- 4 flows: x = -1050, -350, 350, 1050
- 5 flows: x = -1400, -700, 0, 700, 1400
- 6 flows: x = -1750, -1050, -350, 350, 1050, 1750

VERTICAL SPACING within each column:
- user-flow node: y = 250 (first level below root)
- First child: y = 600
- Second child: y = 950
- Third child: y = 1300
- And so on... (add 350 for each level)

CONDITION NODE BRANCHING:
- When a condition splits paths, offset children horizontally by ±200px
- Left path: parent.x - 200
- Right path: parent.x + 200
- Keep same y-level for siblings from same condition

EXAMPLE POSITIONING for 4-flow app:
{
  "root":        {x: 0, y: 0},
  
  // Column 1: Authentication (x = -1050)
  "auth-flow":   {x: -1050, y: 250},
  "auth-decide": {x: -1050, y: 600},
  "login":       {x: -1250, y: 950},   // left branch
  "signup":      {x: -850, y: 950},    // right branch
  "onboarding":  {x: -850, y: 1300},
  
  // Column 2: Feed (x = -350)
  "feed-flow":   {x: -350, y: 250},
  "home-feed":   {x: -350, y: 600},
  "tweet-detail":{x: -350, y: 950},
  "tweet-actions":{x: -350, y: 1300},
  
  // Column 3: Compose (x = 350)
  "compose-flow":{x: 350, y: 250},
  "post-decide": {x: 350, y: 600},
  "compose-text":{x: 150, y: 950},
  "compose-media":{x: 550, y: 950},
  
  // Column 4: Profile (x = 1050)
  "profile-flow":{x: 1050, y: 250},
  "profile-page":{x: 1050, y: 600},
  "edit-profile":{x: 1050, y: 950},
  
  // Technical nodes: far right column
  "tech-risk1":  {x: 1750, y: 250},
  "tech-risk2":  {x: 1750, y: 600}
}

═══════════════════════════════════════════════════════════════════════════════
COMPLETE EXAMPLE: Twitter Clone
═══════════════════════════════════════════════════════════════════════════════

{
  "nodes": [
    {"id": "root", "type": "core-concept", "position": {"x": 0, "y": 0}, "data": {"label": "Twitter Clone", "description": null, "feasibility": null, "features": null}},
    
    // Column 1: Authentication (x = -1050)
    {"id": "auth-flow", "type": "user-flow", "position": {"x": -1050, "y": 250}, "data": {"label": "Authentication Flow", "description": "User login and registration journey", "feasibility": null, "features": null}},
    {"id": "auth-decision", "type": "condition", "position": {"x": -1050, "y": 600}, "data": {"label": "New or Returning?", "description": null, "feasibility": null, "features": null}},
    {"id": "login-screen", "type": "screen-ui", "position": {"x": -1250, "y": 950}, "data": {"label": "Login Screen", "description": null, "feasibility": null, "features": [{"id": "f1", "label": "Email Input"}, {"id": "f2", "label": "Password Input"}, {"id": "f3", "label": "Remember Me Toggle"}, {"id": "f4", "label": "Login Button"}, {"id": "f5", "label": "Forgot Password Link"}, {"id": "f6", "label": "Google OAuth"}, {"id": "f7", "label": "Apple OAuth"}]}},
    {"id": "signup-screen", "type": "screen-ui", "position": {"x": -850, "y": 950}, "data": {"label": "Sign Up Screen", "description": null, "feasibility": null, "features": [{"id": "f8", "label": "Display Name Input"}, {"id": "f9", "label": "Email Input"}, {"id": "f10", "label": "Password Input"}, {"id": "f11", "label": "Date of Birth Picker"}, {"id": "f12", "label": "Terms Checkbox"}, {"id": "f13", "label": "Create Account Button"}]}},
    {"id": "onboarding-screen", "type": "screen-ui", "position": {"x": -850, "y": 1300}, "data": {"label": "Onboarding", "description": null, "feasibility": null, "features": [{"id": "f14", "label": "Profile Photo Upload"}, {"id": "f15", "label": "Bio Input"}, {"id": "f16", "label": "Interest Tags"}, {"id": "f17", "label": "Follow Suggestions"}, {"id": "f18", "label": "Skip Button"}, {"id": "f19", "label": "Continue Button"}]}},
    
    // Column 2: Feed (x = -350)
    {"id": "feed-flow", "type": "user-flow", "position": {"x": -350, "y": 250}, "data": {"label": "Home & Feed", "description": "Main content consumption experience", "feasibility": null, "features": null}},
    {"id": "home-feed", "type": "screen-ui", "position": {"x": -350, "y": 600}, "data": {"label": "Home Feed", "description": null, "feasibility": null, "features": [{"id": "f20", "label": "For You Tab"}, {"id": "f21", "label": "Following Tab"}, {"id": "f22", "label": "Tweet Cards"}, {"id": "f23", "label": "Pull to Refresh"}, {"id": "f24", "label": "Floating Compose Button"}]}},
    {"id": "tweet-detail", "type": "screen-ui", "position": {"x": -350, "y": 950}, "data": {"label": "Tweet Detail", "description": null, "feasibility": null, "features": [{"id": "f25", "label": "Original Tweet"}, {"id": "f26", "label": "Reply Thread"}, {"id": "f27", "label": "Reply Input"}, {"id": "f28", "label": "Share Options"}]}},
    {"id": "tweet-actions", "type": "feature", "position": {"x": -350, "y": 1300}, "data": {"label": "Tweet Actions", "description": null, "feasibility": null, "features": [{"id": "f29", "label": "Like"}, {"id": "f30", "label": "Retweet"}, {"id": "f31", "label": "Quote Tweet"}, {"id": "f32", "label": "Reply"}, {"id": "f33", "label": "Bookmark"}, {"id": "f34", "label": "Share"}]}},
    
    // Column 3: Compose (x = 350)
    {"id": "compose-flow", "type": "user-flow", "position": {"x": 350, "y": 250}, "data": {"label": "Compose Flow", "description": "Creating and publishing content", "feasibility": null, "features": null}},
    {"id": "post-type-decision", "type": "condition", "position": {"x": 350, "y": 600}, "data": {"label": "Post Type?", "description": null, "feasibility": null, "features": null}},
    {"id": "compose-modal", "type": "screen-ui", "position": {"x": 150, "y": 950}, "data": {"label": "Compose Tweet", "description": null, "feasibility": null, "features": [{"id": "f35", "label": "Text Input (280 chars)"}, {"id": "f36", "label": "Character Counter"}, {"id": "f37", "label": "Add Media Button"}, {"id": "f38", "label": "Add GIF Button"}, {"id": "f39", "label": "Add Poll Button"}, {"id": "f40", "label": "Audience Selector"}, {"id": "f41", "label": "Tweet Button"}]}},
    {"id": "media-upload", "type": "feature", "position": {"x": 550, "y": 950}, "data": {"label": "Media Upload", "description": null, "feasibility": null, "features": [{"id": "f42", "label": "Photo Upload"}, {"id": "f43", "label": "Video Upload"}, {"id": "f44", "label": "Camera Capture"}, {"id": "f45", "label": "Edit/Crop"}, {"id": "f46", "label": "Alt Text"}]}},
    
    // Column 4: Profile (x = 1050)
    {"id": "profile-flow", "type": "user-flow", "position": {"x": 1050, "y": 250}, "data": {"label": "Profile & Settings", "description": "User profile management", "feasibility": null, "features": null}},
    {"id": "profile-page", "type": "screen-ui", "position": {"x": 1050, "y": 600}, "data": {"label": "Profile Page", "description": null, "feasibility": null, "features": [{"id": "f47", "label": "Cover Photo"}, {"id": "f48", "label": "Avatar"}, {"id": "f49", "label": "Display Name"}, {"id": "f50", "label": "Bio"}, {"id": "f51", "label": "Followers Count"}, {"id": "f52", "label": "Following Count"}, {"id": "f53", "label": "Tweets Tab"}, {"id": "f54", "label": "Replies Tab"}, {"id": "f55", "label": "Likes Tab"}]}},
    {"id": "edit-profile", "type": "screen-ui", "position": {"x": 1050, "y": 950}, "data": {"label": "Edit Profile", "description": null, "feasibility": null, "features": [{"id": "f56", "label": "Change Avatar"}, {"id": "f57", "label": "Change Cover"}, {"id": "f58", "label": "Edit Name"}, {"id": "f59", "label": "Edit Bio"}, {"id": "f60", "label": "Edit Location"}, {"id": "f61", "label": "Save Button"}]}},
    
    // Column 5: Technical (x = 1750)
    {"id": "risk-realtime", "type": "custom-node", "position": {"x": 1750, "y": 250}, "data": {"label": "Real-time Updates", "description": "WebSocket infrastructure for live feed updates", "feasibility": "yellow", "features": null}},
    {"id": "risk-scale", "type": "custom-node", "position": {"x": 1750, "y": 600}, "data": {"label": "Scale & Performance", "description": "Handling viral tweets with millions of engagements", "feasibility": "red", "features": null}}
  ],
  "edges": [
    {"id": "e1", "source": "root", "target": "auth-flow", "label": null},
    {"id": "e2", "source": "root", "target": "feed-flow", "label": null},
    {"id": "e3", "source": "root", "target": "compose-flow", "label": null},
    {"id": "e4", "source": "root", "target": "profile-flow", "label": null},
    {"id": "e5", "source": "auth-flow", "target": "auth-decision", "label": null},
    {"id": "e6", "source": "auth-decision", "target": "login-screen", "label": "Returning User"},
    {"id": "e7", "source": "auth-decision", "target": "signup-screen", "label": "New User"},
    {"id": "e8", "source": "signup-screen", "target": "onboarding-screen", "label": "After Sign Up"},
    {"id": "e9", "source": "feed-flow", "target": "home-feed", "label": null},
    {"id": "e10", "source": "home-feed", "target": "tweet-detail", "label": "Tap Tweet"},
    {"id": "e11", "source": "tweet-detail", "target": "tweet-actions", "label": null},
    {"id": "e12", "source": "compose-flow", "target": "post-type-decision", "label": null},
    {"id": "e13", "source": "post-type-decision", "target": "compose-modal", "label": "Text/Thread"},
    {"id": "e14", "source": "post-type-decision", "target": "media-upload", "label": "With Media"},
    {"id": "e15", "source": "profile-flow", "target": "profile-page", "label": null},
    {"id": "e16", "source": "profile-page", "target": "edit-profile", "label": "Edit Button"},
    {"id": "e17", "source": "root", "target": "risk-realtime", "label": null},
    {"id": "e18", "source": "risk-realtime", "target": "risk-scale", "label": null}
  ]
}

═══════════════════════════════════════════════════════════════════════════════
GENERATION REQUIREMENTS:
═══════════════════════════════════════════════════════════════════════════════
- Minimum: 15 nodes for simple apps
- Standard: 20-35 nodes for typical apps
- Complex: 40+ nodes for enterprise apps
- MUST include:
  * 1 core-concept (root)
  * 3-6 user-flow nodes (main journeys)
  * 5-15 screen-ui nodes (actual screens)
  * 1-4 condition nodes (decision points)
  * 2-5 feature nodes (action groups)
  * 1-3 custom-node (technical risks)
- Each screen-ui MUST have 5-10 features
- Each feature node MUST have 4-8 features
- Condition nodes MUST have 2+ outgoing edges with labels

CHECKLIST BEFORE OUTPUT:
□ Root node is "core-concept" at {x:0, y:0}
□ User-flows connect directly to root
□ All screens use type "screen-ui" (NOT "screen")
□ All decisions use type "condition" (NOT "decision")  
□ All risks use type "custom-node" (NOT "risk")
□ Each flow is in its own column (700px spacing)
□ Vertical spacing is 350px between levels
□ No nodes overlap
□ All edges have valid source/target IDs
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
