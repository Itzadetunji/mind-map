# Mind Map Generator - Copilot Instructions

## Project Overview

This is an AI-powered mind map generation app built with React, Vite, TanStack Start/Router, React Flow, and Supabase.

## Tech Stack

- **Frontend**: React 19 with TypeScript, Vite, TanStack Start/Router
- **State Management**: Zustand for auth, TanStack Query for data fetching
- **UI**: React Flow (@xyflow/react) for mind map canvas, Tailwind CSS
- **Backend**: Supabase (Auth, PostgreSQL), OpenAI GPT-4o for AI generation
- **Forms**: TanStack Form

## Key Concepts

### Routing

- `/` - Project selector / home page (ProjectSelector component)
- `/project/$projectId` - Individual project view with MindMap editor

### Data Flow

1. Projects are created in Supabase first, then user navigates to the project URL
2. MindMap component manages local state (nodes/edges) with refs to avoid re-renders
3. Changes are debounced (200ms) before autosaving to Supabase
4. TanStack Query handles data fetching and cache invalidation

### AI Integration

- Initial prompt via FloatingSearchBar → generates full mind map via `generateMindMap()`
- Subsequent chat via AIChatSidebar → uses streaming via `chatWithAIStreaming()`
- Both endpoints save data to Supabase and include full project context

### Conditional UI

- `FloatingSearchBar`: Shows when project has no prompt (first interaction)
- `AIChatSidebar` toggle: Shows only after first prompt is submitted
- `hasPrompt` state determines which UI to show

## Development Commands

```bash
bun install          # Install dependencies
bun run dev          # Start dev server
bun run build        # Build for production
bun run lint         # Run linter
```

## Environment Variables

Required in `.env`:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `OPENAI_API_KEY`

## Best Practices

- Use refs for state that shouldn't trigger re-renders (currentNodesRef, currentEdgesRef)
- Always create projects in Supabase before navigating to avoid duplicate saves
- Invalidate queries after mutations to keep UI in sync
- Keep communication concise and focused
- Follow development best practices
