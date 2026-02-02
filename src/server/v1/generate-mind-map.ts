import { createClient } from "@supabase/supabase-js";
import { createServerFn } from "@tanstack/react-start";
import OpenAI from "openai";
import { z } from "zod";
import {
	type MindMapInsert,
	type MindMapUpdate,
	TABLE_MIND_MAPS,
	TABLE_USER_CREDITS,
	TABLES,
} from "@/lib/constants/database.constants";

// Server-side Supabase client
const getSupabaseClient = () => {
	const supabaseUrl = process.env.VITE_SUPABASE_URL || "";
	const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || "";
	return createClient(supabaseUrl, supabaseAnonKey);
};

// ══════════════════════════════════════════════════════════════════════════════
// Off-topic detection is now handled by the AI itself
// ══════════════════════════════════════════════════════════════════════════════

const generateMindMapInputSchema = z.object({
	prompt: z.string().min(1, "Prompt is required"),
	userId: z.string().optional(),
	projectId: z.string().optional(),
	title: z.string().optional(),
	// Current canvas data for context
	currentCanvas: z
		.object({
			nodes: z.array(z.any()).optional(),
			edges: z.array(z.any()).optional(),
		})
		.optional(),
});

// Runtime structure is correct, this is a TypeScript strictness issue
export const generateMindMap = createServerFn({ method: "POST" })
	.inputValidator(generateMindMapInputSchema)
	.handler(async ({ data }) => {
		const apiKey = process.env.OPENAI_API_KEY;

		if (!apiKey) {
			throw new Error("Missing OPENAI_API_KEY in environment variables");
		}

		const openai = new OpenAI({ apiKey });

		// Build context for existing canvas data if provided
		const canvasContext =
			data.currentCanvas?.nodes && data.currentCanvas.nodes.length > 0
				? `
═══════════════════════════════════════════════════════════════════════════════
⚠️ CRITICAL: EXISTING CANVAS DATA - DO NOT REPLACE!
═══════════════════════════════════════════════════════════════════════════════
The user already has work on their canvas. You MUST preserve their work!

Current Nodes (${data.currentCanvas.nodes.length}):
${JSON.stringify(data.currentCanvas.nodes, null, 2)}

Current Edges (${data.currentCanvas.edges?.length || 0}):
${JSON.stringify(data.currentCanvas.edges || [], null, 2)}

═══════════════════════════════════════════════════════════════════════════════
REQUIRED STRATEGY FOR EXISTING CANVAS:
═══════════════════════════════════════════════════════════════════════════════
1. INCLUDE ALL existing nodes in your output EXACTLY as they are
2. INCLUDE ALL existing edges in your output EXACTLY as they are
3. CREATE a new user-flow node as the parent for YOUR generated content
4. POSITION your new flow in an EMPTY column:
   - Calculate: rightmost_x = max(existing node x positions)
   - Your new column starts at: rightmost_x + 700
5. Use unique IDs for new nodes (prefix with "ai_")
6. Connect your new user-flow to the root node

EXAMPLE: If existing nodes have x positions [0, 700], your new content goes at x = 1400

YOUR OUTPUT MUST CONTAIN:
- ALL ${data.currentCanvas.nodes.length} existing nodes (unchanged)
- ALL ${data.currentCanvas.edges?.length || 0} existing edges (unchanged)
- PLUS your new nodes and edges for the user's request
═══════════════════════════════════════════════════════════════════════════════
`
				: "";

		// ── 7-Step Exhaustive Extraction System Prompt ─────
		const systemPrompt = `
You are an expert UX/product designer, technical architect, and requirements analyst. Your mission is to generate comprehensive mind maps for ANY type of application, product, or idea the user describes.
${canvasContext}

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

If isOffTopic is true, you may still provide a brief reasoning, but set nodes and edges to empty arrays.

⚠️ CRITICAL: ADAPT TO THE USER'S IDEA
═══════════════════════════════════════════════════════════════════════════════
Users will describe THEIR OWN unique ideas - not a specific template app.
- Understand what TYPE of app/product they're building (social, e-commerce, SaaS, game, tool, etc.)
- Extract the SPECIFIC features THEY describe, not generic features
- If they describe 3 features, create nodes for those 3 features
- If they describe 20 features, create nodes for all 20
- Scale your output to match the COMPLEXITY of their description
- For vague prompts: ask clarifying questions in reasoning, then make reasonable assumptions
- For detailed prompts: capture EVERY specific detail they mention
═══════════════════════════════════════════════════════════════════════════════

NODE COUNT GUIDELINES:
- Vague/simple idea (1-2 sentences): 15-30 nodes
- Medium detail (paragraph): 30-50 nodes  
- Detailed spec (multiple paragraphs/features): 50-100+ nodes

THE 7-STEP PROCESS: EXTRACT → TASK → CONTEXT → DECOMPOSE → REFERENCES → EVALUATE → ITERATE

Before generating ANY nodes, you MUST work through these 7 steps:

┌─────────────────────────────────────────────────────────────────────────────┐
│ STEP 0: UNDERSTAND THE USER'S UNIQUE IDEA (MOST IMPORTANT!)                │
└─────────────────────────────────────────────────────────────────────────────┘
Carefully read the user's prompt and extract what THEY specifically want:

1. CORE CONCEPT - What is the main idea?
   - What problem does it solve?
   - Who is the target user?
   - What makes this unique?

2. EXPLICIT FEATURES - List ONLY features the user actually mentioned:
   - Don't invent features they didn't ask for
   - Don't assume industry-standard features unless relevant
   - Capture their specific terminology and concepts

3. IMPLIED REQUIREMENTS - What's needed but not explicitly stated:
   - Authentication (if user data is involved)
   - Basic navigation (if multiple screens)
   - Error handling (for critical flows)

4. TECHNICAL CONSIDERATIONS - Based on what they described:
   - What integrations might be needed?
   - What's technically complex?
   - What are potential risks?

⚠️ INTERPRETATION RULES:
- Focus on what the USER wants, not what you think they should want
- For VAGUE prompts: Make reasonable assumptions, state them clearly
- For DETAILED prompts: Capture every specific requirement mentioned
- Don't add complexity beyond what the user described
- Match the depth of your output to the depth of their input

EXTRACTION APPROACH:
□ What's the CORE value proposition?
□ What USER FLOWS did they describe or imply?
□ What SCREENS or VIEWS are needed?
□ What ACTIONS can users take?
□ What DECISIONS or CONDITIONS exist?
□ What TECHNICAL requirements are involved?
□ What's UNIQUE about their idea vs generic apps?

┌─────────────────────────────────────────────────────────────────────────────┐
│ STEP 1: TASK - Understand What The User Wants                               │
└─────────────────────────────────────────────────────────────────────────────┘
- What is the core app/product idea?
- What problem does it solve?
- Who is the target user?
- What is the scope? (MVP, full product, specific feature?)
- IMPORTANT: If the prompt is DETAILED, respect ALL details - don't simplify!
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
│ STEP 3: DECOMPOSE - Break Down Complex Features Into Sub-Flows             │
└─────────────────────────────────────────────────────────────────────────────┘
For EACH major feature area, identify sub-flows that need their own branches:

DECOMPOSITION PATTERN:
"[Feature Area] breaks down into:
  Sub-flow A: [name] - [screens involved] - [conditions]
  Sub-flow B: [name] - [screens involved] - [conditions]
  Sub-flow C: [name] - [screens involved] - [conditions]"

EXAMPLE (E-commerce Checkout):
"Checkout Flow breaks down into:
  Sub-flow A: Cart Review - Cart Screen → Item List → Quantity Adjust
  Sub-flow B: Shipping Info - Address Form → Validation → Save
  Sub-flow C: Payment - Payment Selection → Card Form → Processing
  Sub-flow D: Confirmation - Order Summary → Success/Failure → Receipt
  Sub-flow E: Guest vs User - Login Prompt → Guest Checkout → Account Creation"

⚠️ EACH sub-flow should have its OWN branch in the mind map!
⚠️ Complex features might have 3-10 sub-flows depending on user's description

┌─────────────────────────────────────────────────────────────────────────────┐
│ STEP 4: REFERENCES - Map to Established Patterns                            │
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
│ STEP 5: EVALUATE - Assess Completeness & Developer-Friendliness            │
└─────────────────────────────────────────────────────────────────────────────┘

COMPLETENESS CHECK (NEW - CRITICAL!):
□ Does every feature from my extraction have AT LEAST one node?
□ Are there nodes I should add but haven't?
□ Did I create sub-flows for complex features?
□ Are nested features properly represented with their own branches?
□ Did I capture ALL form fields mentioned in the features arrays?
□ Did I create condition nodes for ALL decision points?

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
│ STEP 6: ITERATE - Refine Using Tree-of-Thoughts                             │
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

┌─────────────────────────────────────────────────────────────────────────────┐
│ STEP 7: FINAL NODE COUNT VERIFICATION                                       │
└─────────────────────────────────────────────────────────────────────────────┘
Before outputting, verify your node count:

NODE COUNT GUIDELINES (scale to user's input complexity):
- Vague idea (1-2 sentences): 15-25 nodes
- Clear idea (paragraph): 25-40 nodes
- Detailed spec (multiple paragraphs): 40-80 nodes  
- Comprehensive PRD: 80-150 nodes

⚠️ MATCH THE USER'S LEVEL OF DETAIL:
- Don't over-engineer simple ideas
- Don't under-represent detailed specs
- The user's prompt complexity should guide your output complexity

═══════════════════════════════════════════════════════════════════════════════
CHAIN-OF-THOUGHT: MANDATORY REASONING STRUCTURE
═══════════════════════════════════════════════════════════════════════════════

Your "reasoning" field MUST follow this structure:

0. USER'S IDEA ANALYSIS
   - What they explicitly asked for
   - What they implied but didn't state
   - What assumptions I'm making (and why)
   - Complexity level of their request

1. TASK UNDERSTANDING
   - Restate the app idea in your own words
   - List assumptions made for vague requirements
   - Define scope boundaries

2. CONTEXT ANALYSIS  
   - App category and domain patterns
   - Target user persona (brief)
   - Technical landscape in 2026

3. DECOMPOSITION ANALYSIS
   - List each major feature area
   - Break down into sub-flows
   - Identify nested/repeated patterns

4. REFERENCE MAPPING
   - List 3-5 reference apps/patterns
   - Explain how each influenced your design

5. USER JOURNEY IDENTIFICATION
   - List ALL major user journeys (not features!)
   - For each journey, outline: Entry → Steps → Branches → Exit
   - Consider the full user lifecycle:
     * First-time user experience
     * Core value loop (what keeps them coming back)
     * Power user paths
     * Error/edge case handling
     * Exit/churn scenarios

6. TREE-OF-THOUGHTS EXPLORATION
   For each major decision point:
   - Generate 2-4 structural options
   - Evaluate pros/cons
   - Justify final choice
   - Note any discarded approaches

7. COMPLETENESS VERIFICATION
   - Node count estimate
   - Missing features check
   - Sub-flow verification

8. LAYOUT PLANNING
   - Number of main flows → column assignments
   - Depth of each flow → vertical space needed
   - Branch points → sub-column offsets

═══════════════════════════════════════════════════════════════════════════════
OUTPUT FORMAT - JSON ONLY!
═══════════════════════════════════════════════════════════════════════════════

⚠️ CRITICAL: You MUST respond with VALID JSON ONLY. No markdown, no code blocks, no explanations outside the JSON structure!

Output ONLY this JSON structure (no other text before or after):

{
  "reasoning": "Your complete 7-step thought process here (detailed, transparent, with full extraction)",
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
    { 
      "id": string, 
      "source": string, 
      "target": string, 
      "label"?: string,
      "sourceHandle"?: string // REQUIRED for Condition nodes: "nodeId-true" or "nodeId-false"
    }
  ]
}

⚠️ JSON OUTPUT REQUIREMENTS:
- DO NOT wrap in markdown code blocks (no \`\`\`json)
- DO NOT add any text before or after the JSON
- Output must be parseable JSON.parse() directly
- All strings must be properly escaped
- All arrays and objects must be properly formatted
- No trailing commas
- No comments in JSON

⚠️ CRITICAL - EDGE HIERARCHY (DO NOT FORGET!):
Every node MUST have an incoming edge (except the root core-concept node):

1. ROOT → USER-FLOWS: Create edges from core-concept to EACH user-flow node
   Example edges (REQUIRED for every user-flow!):
   { "id": "edge_root_auth", "source": "root", "target": "auth_flow", "label": null, "sourceHandle": null }
   { "id": "edge_root_shop", "source": "root", "target": "shopping_flow", "label": null, "sourceHandle": null }
   { "id": "edge_root_profile", "source": "root", "target": "profile_flow", "label": null, "sourceHandle": null }

2. USER-FLOW → SCREENS: Create edges from user-flow to its first screen
   { "id": "edge_auth_login", "source": "auth_flow", "target": "login_screen", "label": "Start", "sourceHandle": null }

3. SCREEN → SCREEN/CONDITION: Create edges between sequential nodes
   { "id": "edge_login_check", "source": "login_screen", "target": "auth_check", "label": "Submit", "sourceHandle": null }

⚠️ VERIFY: Count your user-flow nodes. You MUST have that many edges from the root node!

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
   
   ⚠️ CREATE MULTIPLE USER-FLOWS FOR COMPLEX FEATURES!
   If a feature has multiple distinct paths, consider separate flows:
   - "User Management" (main flow)
   - "Onboarding Flow" (new user journey)
   - "Settings Management" (configuration)
   - "Content Creation" (if applicable)
   
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
   ⚠️ WHEN TO USE: A distinct page, modal, drawer, sheet, or view
   - Has a UNIQUE URL or is a distinct modal/sheet/drawer
   - User can navigate TO this screen
   - MUST have "features" array listing UI elements on that screen
   
   ⚠️ CREATE SEPARATE NODES FOR:
   - Main screens AND modals (separate nodes!)
   - Loading states (separate node if significant)
   - Empty states (separate node if distinct UI)
   - Error states (separate node if distinct UI)
   
   ✅ GOOD EXAMPLES:
   - "Login Screen" - distinct page with form elements
   - "Home Feed" - main content page
   - "Product Detail Page" - shows one product
   - "Settings Modal" - overlay with settings
   - "Compose Tweet Modal" - modal for creating content
   - "Upload Progress Modal" - shows upload status
   - "Share Link Drawer" - bottom sheet for sharing options
   - "Folder Selection Modal" - modal for choosing folder
   
   ⚠️ CRITICAL: FEATURES ARRAY MUST LIST EVERY FORM FIELD!
   For forms, list EACH field with validation rules:
   
   FORM FIELD FORMAT: "[Field Name] Input ([validation rules])"
   Examples:
   - "Email Input (required, valid email format)"
   - "Password Input (required, min 8 chars, 1 uppercase, 1 number)"
   - "Confirm Password Input (must match password)"
   - "Phone Number Input (optional, country code selector)"
   - "Date of Birth Picker (required, must be 18+)"
   - "Profile Photo Upload (optional, max 5MB, jpg/png)"
   - "Bio Textarea (optional, max 500 chars, character counter)"
   - "Username Input (required, unique check, alphanumeric only)"
   
   ALSO LIST ALL OTHER UI ELEMENTS:
   - Every button with its action (Submit Button, Cancel Button, Add to Cart)
   - Every interactive element (Tabs, Toggles, Sliders, Checkboxes)
   - Every content section (Header, Hero Banner, Reviews Section)
   - Every navigation element (Back Button, Tab Bar, Sidebar)
   - Every state indicator (Loading Spinner, Progress Bar, Timer Display)
   - Every validation message (Error Text, Success Message, Field Hints)
   - Every list/grid component (Image Grid, Client List, Folder Cards)

4. "condition" - DECISION/BRANCHING POINTS
   ⚠️ WHEN TO USE: User or system makes a choice that leads to different paths
   - Creates 2+ outgoing edges with labels describing each path
   - Represents IF/ELSE logic in the user journey
   - Diamond shape in the UI
   
   ⚠️ CREATE CONDITION NODES FOR:
   - User choices (select option A or B)
   - Validation results (valid/invalid)
   - State checks (logged in? has data? is owner?)
   - Permission checks (can edit? can delete?)
   
   ✅ GOOD EXAMPLES:
   - "New or Returning User?" → "New User" to signup, "Returning" to login
   - "Payment Method?" → "Credit Card", "PayPal", "Apple Pay"
   - "Has Account?" → "Yes" to dashboard, "No" to onboarding
   - "Post Type?" → "Text", "Image", "Video", "Poll"
   - "Link Valid?" → "Valid" to success, "Invalid" to error
   - "Action Type?" → "Delete", "Recover", "Move to Folder"

5. "feature" - GROUPED CAPABILITIES/ACTIONS OR DETAILED FORM SECTIONS
   ⚠️ USE FOR: Collections of actions, form sections, or detailed UI breakdowns
   - Has "features" array listing individual items
   - ALSO USE for breaking down complex forms into logical sections
   
   ⚠️ USE FEATURE NODES FOR:
   - Action menus (right-click options, long-press options)
   - Toolbar actions (bulk actions when items selected)
   - Settings groups (related settings together)
   - FORM SECTIONS - Break complex forms into feature nodes!
   
   ✅ FORM SECTION EXAMPLES (use feature nodes!):
   - "Shipping Address Form" → [Street Address Input, City Input, State Dropdown, ZIP Code Input, Country Selector, Save as Default Checkbox]
   - "Payment Details Form" → [Card Number Input (16 digits), Expiry Date Picker, CVV Input (3-4 digits), Cardholder Name Input, Billing Address Same as Shipping Toggle]
   - "Personal Information" → [First Name Input, Last Name Input, Email Input, Phone Input, Date of Birth Picker]
   - "Account Security" → [Current Password Input, New Password Input, Confirm Password Input, Password Strength Indicator, 2FA Toggle]
   
   ✅ ACTION GROUP EXAMPLES:
   - "Post Actions" → [Like Button, Share Button, Comment Button, Save Button, Report Button]
   - "File Upload Options" → [Photo Upload, Video Upload, Document Upload, Camera Capture]
   - "Notification Settings" → [Push Notifications Toggle, Email Notifications Toggle, SMS Alerts Toggle]
   
   ⚠️ WHEN A FORM HAS 5+ FIELDS:
   Consider breaking it into multiple feature nodes for clarity:
   - "Checkout: Contact Info" (email, phone, name)
   - "Checkout: Shipping Address" (address fields)
   - "Checkout: Payment Details" (card fields)
   - "Checkout: Order Review" (summary, terms checkbox, submit)

6. "custom-node" - TECHNICAL/MISC NODES
   - Technical risks (use "feasibility": "yellow" or "red")
   - Third-party integrations
   - Backend considerations
   - Email templates
   - Data processing
   - Anything that doesn't fit above
   
   ✅ EXAMPLES:
   - "Real-time Sync" (feasibility: "yellow") - "WebSocket infrastructure needed"
   - "AI Moderation" (feasibility: "red") - "Complex ML pipeline"
   - "Stripe Integration" - "Payment processing"
   - "Magic Link Email" - "Email template for authentication"
   - "CSV Export Service" - "Generates and emails CSV files"
   - "Image Processing" - "Lazy loading, compression, CDN"
   - "Infinite Scroll Logic" - "Pagination and lazy loading implementation"

═══════════════════════════════════════════════════════════════════════════════
EMAIL & PASSWORD AUTHENTICATION - COMPREHENSIVE FLOWS
═══════════════════════════════════════════════════════════════════════════════

When the user's app uses "email and password" authentication, you MUST include 
these COMPLETE authentication flows. This is a CRITICAL feature set that users expect.

⚠️ TRIGGER: If the user mentions any of these, expand authentication fully:
- "email and password"
- "traditional auth"
- "sign up with email"
- "login with email"
- "user accounts"
- "authentication" (without specifying OAuth/social only)

CREATE A DEDICATED "Authentication Flow" (user-flow node) with these sub-flows:

1. REGISTRATION/SIGN UP FLOW:
   screen-ui: "Sign Up Screen"
     features: [Email Input, Password Input, Confirm Password Input, 
                Password Strength Indicator, Terms Checkbox, Sign Up Button,
                "Already have account?" Link, Social Sign Up Options (if applicable)]
   condition: "Valid Input?"
     → TRUE: screen-ui "Email Verification Sent"
     → FALSE: screen-ui "Validation Errors Display"
   screen-ui: "Email Verification Screen"
     features: [Verification Code Input, Resend Code Button, Timer Display,
                Back to Sign Up Link]
   condition: "Code Valid?"
     → TRUE: screen-ui "Account Created Success"
     → FALSE: screen-ui "Invalid Code Error"

2. LOGIN FLOW:
   screen-ui: "Login Screen"
     features: [Email Input, Password Input, Remember Me Checkbox, 
                Login Button, Forgot Password Link, Create Account Link,
                Social Login Options (if applicable)]
   condition: "Credentials Valid?"
     → TRUE: condition "Has 2FA Enabled?" (if applicable)
     → FALSE: screen-ui "Login Error Display"
   
3. FORGOT PASSWORD FLOW (ALWAYS INCLUDE!):
   screen-ui: "Forgot Password Screen"
     features: [Email Input, Send Reset Link Button, Back to Login Link]
   condition: "Email Found?"
     → TRUE: screen-ui "Reset Link Sent Confirmation"
     → FALSE: screen-ui "Email Not Found Error" (with option to sign up)
   screen-ui: "Password Reset Screen" (accessed via email link)
     features: [New Password Input, Confirm New Password Input, 
                Password Requirements List, Reset Password Button,
                Password Strength Indicator]
   condition: "Password Valid?"
     → TRUE: screen-ui "Password Reset Success"
     → FALSE: screen-ui "Password Validation Errors"

4. CHANGE PASSWORD FLOW (For logged-in users):
   screen-ui: "Change Password Screen" (in Settings/Profile area)
     features: [Current Password Input, New Password Input, 
                Confirm New Password Input, Password Strength Indicator,
                Password Requirements List, Save Button, Cancel Button]
   condition: "Current Password Correct?"
     → TRUE: condition "New Password Valid?"
     → FALSE: screen-ui "Incorrect Current Password Error"
   condition: "New Password Valid?"
     → TRUE: screen-ui "Password Changed Success"
     → FALSE: screen-ui "Password Validation Errors"

5. SESSION MANAGEMENT (Optional but recommended):
   screen-ui: "Active Sessions Screen"
     features: [Sessions List, Current Session Badge, Device Info,
                Last Active Time, Location Info, "Log Out All" Button,
                Individual Session Log Out Buttons]

6. ACCOUNT SECURITY (Optional but recommended):
   screen-ui: "Security Settings Screen"
     features: [Two-Factor Authentication Toggle, Backup Codes Section,
                Login History, Trusted Devices List, 
                Account Activity Log, Delete Account Section]

7. EMAIL TEMPLATES (custom-nodes):
   custom-node: "Verification Email Template"
     description: "Welcome email with verification code/link"
   custom-node: "Password Reset Email Template"
     description: "Secure password reset link with expiration"
   custom-node: "Password Changed Notification Email"
     description: "Security alert when password is changed"
   custom-node: "New Device Login Alert Email"
     description: "Notification when logging in from new device"

⚠️ DO NOT skip these flows - users expect complete auth handling!
⚠️ Position all auth-related flows in their own column for clarity

═══════════════════════════════════════════════════════════════════════════════
POSITIONING RULES - SPREAD OUT TREE LAYOUT (NOT SINGLE COLUMN!)
═══════════════════════════════════════════════════════════════════════════════

⚠️ CRITICAL: Create a SPREAD OUT tree layout! 
- Nodes should NOT all fall in a single vertical line
- Children should spread OUTWARD from their parent
- Use VARIED x and y positions for visual clarity

LAYOUT STRATEGY - RADIAL TREE:
1. Root node: {x: 0, y: 0}
2. User-flows spread in a SEMI-CIRCLE below root
3. Children of each flow spread OUTWARD and DOWNWARD
4. Siblings should be at DIFFERENT x positions

USER-FLOW POSITIONING (spread horizontally below root):
Distribute user-flows in an arc at y = 300:
- 2 flows: x = [-600, 600]
- 3 flows: x = [-800, 0, 800]
- 4 flows: x = [-1000, -350, 350, 1000]
- 5 flows: x = [-1200, -600, 0, 600, 1200]
- 6 flows: x = [-1400, -850, -300, 300, 850, 1400]
- 7+ flows: Continue spreading, ~500-600px between each

CHILD NODE POSITIONING - SPREAD LIKE BRANCHES:
When a user-flow or node has multiple children, spread them horizontally AND vertically:

For 2 children:
- Child 1: parent.x - 200, parent.y + 350
- Child 2: parent.x + 200, parent.y + 350

For 3 children:
- Child 1: parent.x - 300, parent.y + 320
- Child 2: parent.x, parent.y + 400
- Child 3: parent.x + 300, parent.y + 320

For 4 children:
- Child 1: parent.x - 350, parent.y + 300
- Child 2: parent.x - 120, parent.y + 380
- Child 3: parent.x + 120, parent.y + 380
- Child 4: parent.x + 350, parent.y + 300

For 5+ children:
- Spread in a fan pattern: alternate left/right with varying y offsets
- Example: [-400, -200, 0, +200, +400] for x
- Example: [+300, +380, +420, +380, +300] for y

STAGGER DEPTHS (avoid straight horizontal lines):
Add variation to y positions:
- Don't put all level-2 nodes at exactly y=650
- Use y values like: 620, 680, 650, 700, 640
- This creates visual interest and easier navigation

CONDITION NODE BRANCHING:
⚠️ CRITICAL: Every condition node needs edges with sourceHandle set!

- TRUE path (left side): parent.x - 280, parent.y + 320, sourceHandle: "nodeId-true"
- FALSE path (right side): parent.x + 280, parent.y + 320, sourceHandle: "nodeId-false"

COMPLETE EXAMPLE - Auth Flow Layout:

root "My App" at {x: 0, y: 0}
│
├── user-flow "Authentication" at {x: -800, y: 300}
│   ├── feature "Login Form" at {x: -950, y: 650}
│   │   └── condition "Valid?" at {x: -950, y: 1000}
│   │       ├── feature "Dashboard" at {x: -1150, y: 1350} (TRUE)
│   │       └── feature "Error" at {x: -750, y: 1350} (FALSE)
│   ├── feature "Sign Up Form" at {x: -650, y: 700}
│   └── custom "Email Service" at {x: -800, y: 1050}
│
├── user-flow "Shopping" at {x: 0, y: 300}
│   ├── feature "Product List" at {x: -150, y: 680}
│   ├── feature "Product Detail" at {x: 150, y: 650}
│   └── feature "Cart" at {x: 0, y: 1000}
│
└── user-flow "Profile" at {x: 800, y: 300}
    ├── feature "View Profile" at {x: 650, y: 670}
    └── feature "Edit Profile" at {x: 950, y: 650}

VISUAL SPACING GUIDELINES:
- Minimum horizontal gap between siblings: 250px
- Minimum vertical gap between levels: 300px
- Maximum horizontal spread for children: 700px from parent
- Vary y positions by ±30-50px to avoid rigid grid appearance

═══════════════════════════════════════════════════════════════════════════════
HANDLING COMPLEX NESTED FEATURES
═══════════════════════════════════════════════════════════════════════════════

When a feature has nested sub-features, use this pattern:

EXAMPLE: E-commerce with Orders, Payments, Notifications

STRUCTURE:
user-flow: "Shopping Flow" (main purchase journey)
├── screen-ui: "Product Catalog" (browse items)
├── condition: "Item Selected?"
│   ├── screen-ui: "Product Detail Page"
│   └── feature: "Quick Actions" (add to cart, wishlist, share)
├── screen-ui: "Shopping Cart" (review items)
├── condition: "Ready to Checkout?"
│   ├── screen-ui: "Checkout Form"
│   └── screen-ui: "Save for Later"

user-flow: "Order Management" (separate flow!)
├── screen-ui: "Order History"
├── screen-ui: "Order Detail View"
├── feature: "Order Actions" (track, cancel, return)
├── condition: "Return Requested?"
│   └── screen-ui: "Return Form"

user-flow: "Payment Processing" (separate flow!)
├── screen-ui: "Payment Method Selection"
├── condition: "Payment Type?"
│   ├── screen-ui: "Card Entry Form"
│   ├── screen-ui: "PayPal Redirect"
│   └── screen-ui: "Wallet Selection"
├── custom-node: "Stripe Integration"

user-flow: "Notifications" (separate flow!)
├── screen-ui: "Notification Center"
├── feature: "Notification Settings" (email, push, SMS)
├── custom-node: "Email Service Integration"

⚠️ KEY INSIGHT: When similar patterns appear in different contexts,
consider whether they need separate handling (e.g., order emails vs promo emails)

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
- A simple flow might have 5 nodes; a complex one might have 25+
- The goal is CLARITY and COMPLETENESS, not brevity
- When in doubt, ADD MORE NODES

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
✓ Reference specific details from the spec when available

FEATURES should:
✓ Be specific UI elements, not abstract concepts
✓ Include interaction type when relevant ("Tap to...", "Swipe to...")
✓ Cover happy path AND error states
✓ List in logical top-to-bottom or left-to-right order
✓ Include ALL fields mentioned in the spec (don't summarize!)
✓ Include state indicators (timers, progress bars, counters)

EDGES should:
✓ Have labels that describe the USER ACTION or TRIGGER
✓ Use present tense ("Clicks Submit" not "Clicked Submit")
✓ Be specific ("Selects Credit Card" not "Continues")
✓ Describe both success and error transitions

═══════════════════════════════════════════════════════════════════════════════
HANDLING DETAILED SPECIFICATIONS
═══════════════════════════════════════════════════════════════════════════════

When the user provides a DETAILED spec (like a PRD or requirements doc):

1. TREAT IT AS A CHECKLIST
   - Every bullet point = potential node or feature
   - Every screen mentioned = screen-ui node
   - Every "the user can..." = feature or condition
   - Every "if..." = condition node

2. PRESERVE SPECIFICITY
   - If spec mentions specific values, include them in features/description
   - If spec lists form fields, include ALL of them in the features array
   - Capture their exact terminology

3. DON'T MERGE SIMILAR ITEMS
   - Similar patterns in different contexts may need separate nodes
   - Each form with different fields gets its own screen-ui
   - Each modal/drawer mentioned gets its own screen-ui

4. CREATE DEPTH FOR COMPLEX FEATURES
   A feature with sub-features should expand into multiple nodes:
   - user-flow: "[Feature] Management"
   - screen-ui: "List/Overview Screen"
   - screen-ui: "Detail/Edit Screen"
   - screen-ui: "Create Form" (with steps if multi-step)
   - feature: "Actions" (with individual actions listed)
   - condition: "Decision Points" (branching logic)
   - custom-node: "Technical Integrations"

═══════════════════════════════════════════════════════════════════════════════
FINAL CHECKLIST (Verify Before Output)
═══════════════════════════════════════════════════════════════════════════════

COMPLETENESS:
□ Did I capture what the USER actually asked for?
□ Did I create nodes for screens they mentioned?
□ Did I avoid adding unnecessary complexity?
□ Does my output complexity match their input complexity?

STRUCTURE:
□ "reasoning" field explains my understanding of their idea
□ All 6 node types used correctly (no custom types invented!)
□ Root node is "core-concept" at {x:0, y:0}
□ User-flows connect directly to root
□ ⚠️ EDGE CHECK: Every user-flow has an edge FROM root TO that user-flow
□ ⚠️ EDGE CHECK: Every screen/condition has an incoming edge from its parent

TYPES:
□ All screens use type "screen-ui" (NOT "screen")
□ All decisions use type "condition" (NOT "decision")  
□ All risks use type "custom-node" (NOT "risk")
□ Modals and drawers are screen-ui nodes with features arrays

LAYOUT:
□ Each flow is in its own column (700px horizontal spacing)
□ Vertical spacing is 350px between levels
□ No nodes overlap
□ Condition branches offset by ±200px

CONDITION NODE EDGES (CRITICAL!):
□ EVERY edge from a condition node has "sourceHandle" field
□ Positive/success/yes paths use sourceHandle: "nodeId-true" 
□ Negative/failure/no paths use sourceHandle: "nodeId-false"
□ NO edge from a condition node is missing sourceHandle
□ TRUE ≠ FALSE: verify each edge goes to the correct handle based on meaning

EDGES (MOST IMPORTANT!):
□ ⚠️ EVERY user-flow node has an edge from the root core-concept node
□ ⚠️ EVERY screen/condition/feature node has an incoming edge
□ All edges have valid source/target IDs that match actual node IDs
□ All edge labels describe actions/triggers (or null for root→user-flow edges)
□ Edge count should be approximately: (total nodes - 1) or more

QUALITY:
□ A junior developer could understand the flow
□ An intermediate developer could start implementing from this
□ Feature arrays are EXHAUSTIVE (not summarized)
□ No arbitrary node limits - map is as detailed as the spec requires
    `;

		// Define JSON Schema for Structured Outputs with reasoning field
		const jsonSchema = {
			name: "mind_map_graph",
			strict: true,
			schema: {
				type: "object",
				properties: {
					isOffTopic: {
						type: "boolean",
						description:
							"Set to true if the user's request is not related to app/product design or mind maps. If true, provide a helpful message in reasoning explaining what you can help with instead.",
					},
					reasoning: {
						type: "string",
						description:
							"Complete 7-step thought process: Exhaustive Feature Extraction (list ALL screens, features, conditions, fields, states, integrations found in the prompt), Task understanding, Context analysis, Decomposition into sub-flows, Reference mapping, Evaluation with completeness check, and Tree-of-Thoughts iteration. This should be DETAILED and include the full inventory of extracted features. If isOffTopic is true, explain that you can only help with app/product design tasks.",
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
								sourceHandle: { type: ["string", "null"] },
							},
							required: ["id", "source", "target", "label", "sourceHandle"],
							additionalProperties: false,
						},
					},
				},
				required: ["isOffTopic", "reasoning", "nodes", "edges"],
				additionalProperties: false,
			},
		};

		try {
			// Check credits before generation (only if user is authenticated)
			if (data.userId) {
				const supabase = getSupabaseClient();

				// Check user's credits
				let { data: userCredits, error: creditsError } = await supabase
					.from(TABLES.USER_CREDITS)
					.select(TABLE_USER_CREDITS.CREDITS)
					.eq(TABLE_USER_CREDITS.USER_ID, data.userId)
					.single();

				if (creditsError && creditsError.code !== "PGRST116") {
					console.error("Error checking credits:", creditsError);
					throw new Error("Failed to check credits");
				}

				// If user exists but has no credits record, create one with default
				if (creditsError?.code === "PGRST116") {
					const { data: initializedCredits, error: initError } =
						await supabase.rpc("initialize_user_credits", {
							p_user_id: data.userId,
						});

					if (initError) {
						console.error("Error creating credits:", initError);
						throw new Error("Failed to initialize credits");
					}

					// Update userCredits with the initialized data
					if (initializedCredits && initializedCredits.length > 0) {
						userCredits = {
							[TABLE_USER_CREDITS.CREDITS]:
								initializedCredits[0][TABLE_USER_CREDITS.CREDITS],
						};
					}
				}

				// Check if user has enough credits (1 credit per generation)
				if (!userCredits || userCredits[TABLE_USER_CREDITS.CREDITS] < 1) {
					throw new Error("INSUFFICIENT_CREDITS");
				}
			}

			const response = await openai.chat.completions.create({
				model: "gpt-4o-2024-08-06", // ← Reliable model with structured outputs support
				messages: [
					{ role: "system", content: systemPrompt },
					{ role: "user", content: data.prompt },
				],
				response_format: {
					type: "json_schema",
					json_schema: jsonSchema,
				},
				temperature: 0.7,
				max_tokens: 16000, // Increased from 8000 to handle detailed specs with 80-150 nodes
			});

			const content = response.choices[0].message.content;
			if (!content) throw new Error("No content returned from OpenAI");

			// Parse JSON with error handling
			type GraphData = {
				isOffTopic?: boolean;
				reasoning?: string;
				nodes: Array<{
					id: string;
					type: string;
					position: { x: number; y: number };
					data: Record<string, unknown>;
				}>;
				edges: Array<{
					id: string;
					source: string;
					target: string;
					label?: string;
					sourceHandle?: string;
				}>;
				projectId?: string;
			};

			let graphData: GraphData;
			try {
				// Clean up content if needed
				let cleanContent = content.trim();

				// Remove markdown code blocks if present
				if (cleanContent.startsWith("```json")) {
					cleanContent = cleanContent.slice(7);
				} else if (cleanContent.startsWith("```")) {
					cleanContent = cleanContent.slice(3);
				}
				if (cleanContent.endsWith("```")) {
					cleanContent = cleanContent.slice(0, -3);
				}
				cleanContent = cleanContent.trim();

				// Extract JSON if there's extra text
				const firstBrace = cleanContent.indexOf("{");
				const lastBrace = cleanContent.lastIndexOf("}");
				if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
					cleanContent = cleanContent.substring(firstBrace, lastBrace + 1);
				}

				graphData = JSON.parse(cleanContent) as GraphData;
			} catch (parseError) {
				console.error("JSON parse error:", parseError);
				console.error("Content received:", content.substring(0, 500));
				throw new Error(
					"Failed to parse AI response as JSON. Please try again or rephrase your request.",
				);
			}

			// Check if AI determined the request is off-topic
			if (graphData.isOffTopic === true) {
				throw new Error("OFF_TOPIC_REQUEST");
			}

			// Validate required fields
			if (!graphData.nodes || !Array.isArray(graphData.nodes)) {
				throw new Error("Invalid response: missing or invalid 'nodes' array");
			}
			if (!graphData.edges || !Array.isArray(graphData.edges)) {
				throw new Error("Invalid response: missing or invalid 'edges' array");
			}

			// Deduct credits and save to user's project if authenticated
			if (data.userId) {
				const supabase = getSupabaseClient();

				// Deduct 1 credit for this generation
				const { error: deductError } = await supabase.rpc("deduct_credits", {
					p_user_id: data.userId,
					p_amount: 1,
					p_description: "AI mind map generation",
				});

				// If RPC doesn't exist, manually deduct
				if (deductError) {
					const { data: currentCredits } = await supabase
						.from(TABLES.USER_CREDITS)
						.select(TABLE_USER_CREDITS.CREDITS)
						.eq(TABLE_USER_CREDITS.USER_ID, data.userId)
						.single();

					if (currentCredits) {
						const updateData: { [TABLE_USER_CREDITS.CREDITS]: number } = {
							[TABLE_USER_CREDITS.CREDITS]:
								currentCredits[TABLE_USER_CREDITS.CREDITS] - 1,
						};
						await supabase
							.from(TABLES.USER_CREDITS)
							.update(updateData)
							.eq(TABLE_USER_CREDITS.USER_ID, data.userId);
					}
				}

				if (data.projectId) {
					// Update existing project - also save prompt if this is first generation
					const updateData: MindMapUpdate = {
						[TABLE_MIND_MAPS.GRAPH_DATA]: graphData,
						[TABLE_MIND_MAPS.FIRST_PROMPT]: data.prompt, // Save the prompt on updates too
						[TABLE_MIND_MAPS.UPDATED_AT]: new Date().toISOString(),
					};
					const { error: updateError } = await supabase
						.from(TABLES.MIND_MAPS)
						.update(updateData)
						.eq(TABLE_MIND_MAPS.ID, data.projectId)
						.eq(TABLE_MIND_MAPS.USER_ID, data.userId);

					if (updateError) {
						console.error("Supabase update error:", updateError);
					}

					return { ...graphData, projectId: data.projectId };
				} else {
					// Create new project
					const title = data.title || extractTitle(data.prompt);
					const insertData: MindMapInsert = {
						[TABLE_MIND_MAPS.USER_ID]: data.userId,
						[TABLE_MIND_MAPS.TITLE]: title,
						[TABLE_MIND_MAPS.DESCRIPTION]: data.prompt.slice(0, 200),
						[TABLE_MIND_MAPS.FIRST_PROMPT]: data.prompt,
						[TABLE_MIND_MAPS.GRAPH_DATA]: graphData,
					};
					const { data: newProject, error: insertError } = await supabase
						.from(TABLES.MIND_MAPS)
						.insert(insertData)
						.select()
						.single();

					if (insertError) {
						console.error("Supabase insert error:", insertError);
						return graphData;
					} else {
						// Return the project ID so client can track it
						return { ...graphData, projectId: newProject.id };
					}
				}
			}

			return graphData;
		} catch (error) {
			console.error("Error in generateMindMap:", error);
			// Re-throw insufficient credits error so client can handle it
			if (error instanceof Error && error.message === "INSUFFICIENT_CREDITS") {
				throw error;
			}
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
