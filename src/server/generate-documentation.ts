import { createServerFn } from "@tanstack/react-start";
import OpenAI from "openai";
import { z } from "zod";

const generateDocumentationInputSchema = z.object({
	projectTitle: z.string().min(1, "Project title is required"),
	firstPrompt: z.string().optional(),
	nodes: z.array(z.any()),
	edges: z.array(z.any()),
	format: z.enum(["readme", "prd"]).default("readme"),
});

// System prompt for README.md generation (for AI/developers)
const readmeSystemPrompt = `
You are an expert technical writer and software architect. Your mission is to generate a comprehensive README.md document that can be used by any AI or developer to fully understand and build the described application.

═══════════════════════════════════════════════════════════════════════════════
OUTPUT FORMAT: MARKDOWN README.md
═══════════════════════════════════════════════════════════════════════════════

Generate a complete, well-structured README.md that includes ALL information needed to implement this application. The document should be so thorough that an AI coding assistant can build the entire app from it.

REQUIRED SECTIONS:

# [Project Title]

## Overview
- Brief description of what the application does
- Target users/audience
- Core value proposition
- Key differentiators

## Tech Stack Recommendations
- Recommended frontend framework (React, Vue, etc.)
- Recommended backend (Node.js, Python, etc.)
- Database recommendations
- Authentication approach
- Key third-party services needed

## Features

### Feature Categories
For each major feature area, list:
- Feature name
- Description
- Priority (Must-have / Should-have / Nice-to-have)
- Dependencies on other features

### Complete Feature List
Exhaustive list of ALL features extracted from the mind map, organized by category.

## User Flows

### [Flow Name]
For each major user flow:
1. Entry point
2. Step-by-step user journey
3. Decision points and branches
4. Success/error states
5. Exit points

Include ASCII flowcharts or mermaid diagrams where helpful.

## Screens & UI Components

### [Screen Name]
For each screen:
- Purpose
- Entry conditions
- UI Components (list all)
- User actions available
- State management needs
- API calls required

## Data Models

### [Entity Name]
Infer data models from the features:
- Fields and types
- Relationships
- Validation rules
- Indexes needed

## API Endpoints

### [Endpoint Category]
For each API needed:
- HTTP method
- Endpoint path
- Request body
- Response format
- Authentication required
- Error codes

## Authentication & Authorization
- Auth method details
- User roles and permissions
- Protected routes
- Session management

## Third-Party Integrations
For each integration:
- Service name
- Purpose
- API/SDK details
- Configuration needed

## Technical Considerations
- Performance requirements
- Scalability concerns
- Security considerations
- Edge cases to handle

## Implementation Checklist
A prioritized list of what to build first:
1. [ ] Setup & Configuration
2. [ ] Core features
3. [ ] Secondary features
4. [ ] Polish & optimizations

## Use Cases

### UC-[Number]: [Use Case Title]
For each use case:
- **Actor**: Who performs this
- **Preconditions**: What must be true before
- **Main Flow**: Step-by-step actions
- **Alternative Flows**: Variations
- **Postconditions**: What's true after
- **Business Rules**: Constraints

═══════════════════════════════════════════════════════════════════════════════
EXTRACTION GUIDELINES
═══════════════════════════════════════════════════════════════════════════════

From the mind map data:
- "core-concept" nodes → Project overview
- "user-flow" nodes → Major user journeys
- "screen-ui" nodes → Screen specifications with their features arrays
- "condition" nodes → Decision points and branching logic
- "feature" nodes → Feature groups and capabilities
- "custom-node" nodes → Technical considerations and integrations
- Edge labels → User actions and transitions

CRITICAL: Extract EVERY node and edge. Don't summarize or skip. Be exhaustive.
`;

// System prompt for PRD generation (for non-technical stakeholders)
const prdSystemPrompt = `
You are an expert product manager and business analyst. Your mission is to generate a comprehensive Product Requirements Document (PRD) that explains the application in clear, everyday language that non-technical stakeholders can understand.

═══════════════════════════════════════════════════════════════════════════════
OUTPUT FORMAT: PRD DOCUMENT (Markdown)
═══════════════════════════════════════════════════════════════════════════════

Generate a professional PRD that business stakeholders, investors, or non-technical team members can read to fully understand the product.

REQUIRED SECTIONS:

# [Project Title] - Product Requirements Document

## Executive Summary
- One-paragraph overview of the product
- The problem it solves
- Target market
- Key value proposition

## Product Vision
- Long-term vision for the product
- How it fits in the market
- Success metrics

## Target Users

### Primary Personas
For each user type:
- Who they are
- Their goals
- Their pain points
- How this product helps them

### User Scenarios
Real-world scenarios showing how users will benefit

## Product Features

### Core Features (Must-Have)
Features essential for launch:
- Feature name
- What it does (in simple terms)
- Why users need it
- How it works (user perspective)

### Secondary Features (Should-Have)
Features for enhanced experience:
- Same format as above

### Future Features (Nice-to-Have)
Features for future releases:
- Same format as above

## User Experience

### User Journeys
For each major workflow:
1. Starting point (what triggers this)
2. Steps the user takes (in everyday language)
3. Decisions they make
4. Outcome they achieve

Use simple numbered lists, avoid technical jargon.

### Key Screens
For each screen:
- What the user sees
- What they can do
- Why this screen exists

Use everyday language like "a page where users can..." or "a popup that shows..."

## Business Rules
- Rules that govern how the product works
- Permissions and access levels
- Limitations and constraints
- Written in plain English

## Success Criteria
- How we know the product is successful
- Key metrics to track
- User satisfaction indicators

## Risks & Mitigations
- Potential challenges
- How to address them
- Dependencies on external factors

## Timeline Recommendations
- Suggested phases
- What to build first
- MVP vs full product scope

## Glossary
Define any terms that might be unclear to non-technical readers

═══════════════════════════════════════════════════════════════════════════════
WRITING GUIDELINES
═══════════════════════════════════════════════════════════════════════════════

- NO technical jargon (no "API", "endpoint", "database", etc.)
- Use everyday analogies (e.g., "like a filing cabinet" instead of "database")
- Write as if explaining to someone who doesn't use computers daily
- Focus on USER VALUE, not technical implementation
- Use "you" and "your" to make it relatable
- Include examples and scenarios
- Avoid acronyms unless defined

From the mind map data:
- Translate technical nodes into user-friendly language
- Focus on WHAT users can do, not HOW it's implemented
- Turn condition nodes into "if you want to..." scenarios
- Make screen descriptions about user experience, not UI components
`;

export const generateDocumentation = createServerFn({ method: "POST" })
	.inputValidator(generateDocumentationInputSchema)
	.handler(async ({ data }) => {
		const apiKey = process.env.OPENAI_API_KEY;

		if (!apiKey) {
			throw new Error("Missing OPENAI_API_KEY in environment variables");
		}

		const openai = new OpenAI({ apiKey });

		const systemPrompt =
			data.format === "readme" ? readmeSystemPrompt : prdSystemPrompt;

		// Build the context from the mind map data
		const mindMapContext = buildMindMapContext(
			data.projectTitle,
			data.firstPrompt,
			data.nodes,
			data.edges,
		);

		const response = await openai.chat.completions.create({
			model: "gpt-4o-2024-08-06",
			messages: [
				{ role: "system", content: systemPrompt },
				{
					role: "user",
					content: `Generate a ${data.format === "readme" ? "README.md" : "PRD"} for the following application:\n\n${mindMapContext}`,
				},
			],
			temperature: 0.7,
			max_tokens: 16000,
		});

		const content = response.choices[0].message.content;
		if (!content) throw new Error("No content returned from OpenAI");

		return {
			format: data.format,
			content,
			filename:
				data.format === "readme"
					? `${sanitizeFilename(data.projectTitle)}_README.md`
					: `${sanitizeFilename(data.projectTitle)}_PRD.md`,
		};
	});

// Types for mind map data
interface MindMapNode {
	id: string;
	type?: string;
	data?: {
		label?: string;
		description?: string;
		features?: Array<{ label?: string } | string>;
		feasibility?: string;
	};
}

interface MindMapEdge {
	id: string;
	source: string;
	target: string;
	label?: string;
	sourceHandle?: string;
}

// Helper function to build context from mind map data
function buildMindMapContext(
	projectTitle: string,
	firstPrompt: string | undefined,
	nodes: MindMapNode[],
	edges: MindMapEdge[],
): string {
	const sections: string[] = [];

	sections.push(`# Project: ${projectTitle}`);

	if (firstPrompt) {
		sections.push(`\n## Original User Description:\n${firstPrompt}`);
	}

	// Categorize nodes by type
	const nodesByType: Record<string, MindMapNode[]> = {
		"core-concept": [],
		"user-flow": [],
		"screen-ui": [],
		condition: [],
		feature: [],
		"custom-node": [],
	};

	for (const node of nodes) {
		const type = node.type || "custom-node";
		if (nodesByType[type]) {
			nodesByType[type].push(node);
		} else {
			nodesByType["custom-node"].push(node);
		}
	}

	// Core Concept
	if (nodesByType["core-concept"].length > 0) {
		sections.push("\n## Core Concept:");
		for (const node of nodesByType["core-concept"]) {
			sections.push(`- ${node.data?.label || "Unnamed"}`);
			if (node.data?.description) {
				sections.push(`  Description: ${node.data.description}`);
			}
		}
	}

	// User Flows
	if (nodesByType["user-flow"].length > 0) {
		sections.push("\n## User Flows:");
		for (const node of nodesByType["user-flow"]) {
			sections.push(`\n### ${node.data?.label || "Unnamed Flow"}`);
			if (node.data?.description) {
				sections.push(`Description: ${node.data.description}`);
			}

			// Find connected nodes for this flow
			const flowNodes = findConnectedNodes(node.id, nodes, edges);
			if (flowNodes.length > 0) {
				sections.push("\nSteps in this flow:");
				for (const flowNode of flowNodes) {
					const edge = edges.find(
						(e) => e.source === node.id && e.target === flowNode.id,
					);
					const edgeLabel = edge?.label ? ` (${edge.label})` : "";
					sections.push(
						`  - [${flowNode.type}] ${flowNode.data?.label}${edgeLabel}`,
					);
				}
			}
		}
	}

	// Screens
	if (nodesByType["screen-ui"].length > 0) {
		sections.push("\n## Screens:");
		for (const node of nodesByType["screen-ui"]) {
			sections.push(`\n### ${node.data?.label || "Unnamed Screen"}`);
			if (node.data?.description) {
				sections.push(`Description: ${node.data.description}`);
			}
			if (node.data?.features && Array.isArray(node.data.features)) {
				sections.push("UI Components:");
				for (const feature of node.data.features) {
					const label =
						typeof feature === "string" ? feature : feature.label || "Unknown";
					sections.push(`  - ${label}`);
				}
			}
		}
	}

	// Conditions (Decision Points)
	if (nodesByType["condition"].length > 0) {
		sections.push("\n## Decision Points:");
		for (const node of nodesByType["condition"]) {
			sections.push(`\n### ${node.data?.label || "Unnamed Condition"}`);

			// Find outgoing edges with their labels
			const outgoingEdges = edges.filter((e) => e.source === node.id);
			if (outgoingEdges.length > 0) {
				sections.push("Branches:");
				for (const edge of outgoingEdges) {
					const targetNode = nodes.find((n) => n.id === edge.target);
					const handleType = edge.sourceHandle?.includes("-true")
						? "TRUE"
						: edge.sourceHandle?.includes("-false")
							? "FALSE"
							: "→";
					sections.push(
						`  - [${handleType}] ${edge.label || "→"} → ${targetNode?.data?.label || edge.target}`,
					);
				}
			}
		}
	}

	// Features
	if (nodesByType["feature"].length > 0) {
		sections.push("\n## Feature Groups:");
		for (const node of nodesByType["feature"]) {
			sections.push(`\n### ${node.data?.label || "Unnamed Feature Group"}`);
			if (node.data?.description) {
				sections.push(`Description: ${node.data.description}`);
			}
			if (node.data?.features && Array.isArray(node.data.features)) {
				sections.push("Capabilities:");
				for (const feature of node.data.features) {
					const label =
						typeof feature === "string" ? feature : feature.label || "Unknown";
					sections.push(`  - ${label}`);
				}
			}
		}
	}

	// Technical Nodes
	if (nodesByType["custom-node"].length > 0) {
		sections.push("\n## Technical Considerations:");
		for (const node of nodesByType["custom-node"]) {
			sections.push(`\n### ${node.data?.label || "Unnamed"}`);
			if (node.data?.description) {
				sections.push(`Description: ${node.data.description}`);
			}
			if (node.data?.feasibility) {
				const feasibilityMap = {
					green: "Low Risk - Standard implementation",
					yellow: "Medium Risk - Requires careful planning",
					red: "High Risk - Complex implementation needed",
				};
				sections.push(
					`Risk Level: ${feasibilityMap[node.data.feasibility as keyof typeof feasibilityMap] || node.data.feasibility}`,
				);
			}
		}
	}

	// All Edges (for flow understanding)
	sections.push("\n## Complete Flow Connections:");
	for (const edge of edges) {
		const sourceNode = nodes.find((n) => n.id === edge.source);
		const targetNode = nodes.find((n) => n.id === edge.target);
		const label = edge.label ? ` [${edge.label}]` : "";
		const handleInfo = edge.sourceHandle
			? ` (${edge.sourceHandle.includes("-true") ? "True path" : edge.sourceHandle.includes("-false") ? "False path" : ""})`
			: "";
		sections.push(
			`- "${sourceNode?.data?.label || edge.source}" → "${targetNode?.data?.label || edge.target}"${label}${handleInfo}`,
		);
	}

	// Statistics
	sections.push("\n## Mind Map Statistics:");
	sections.push(`- Total Nodes: ${nodes.length}`);
	sections.push(`- Total Connections: ${edges.length}`);
	for (const [type, typeNodes] of Object.entries(nodesByType)) {
		if (typeNodes.length > 0) {
			sections.push(`- ${type}: ${typeNodes.length}`);
		}
	}

	return sections.join("\n");
}

// Helper to find directly connected nodes
function findConnectedNodes(
	sourceId: string,
	nodes: MindMapNode[],
	edges: MindMapEdge[],
): MindMapNode[] {
	const connectedIds = edges
		.filter((e) => e.source === sourceId)
		.map((e) => e.target);
	return nodes.filter((n) => connectedIds.includes(n.id));
}

// Helper to sanitize filename
function sanitizeFilename(name: string): string {
	return name
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, "_")
		.replace(/^_+|_+$/g, "")
		.slice(0, 50);
}
