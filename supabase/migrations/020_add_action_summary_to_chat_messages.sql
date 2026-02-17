-- Add action_summary to chat_messages for short-term memory (graph delta summary per assistant message)
ALTER TABLE chat_messages
ADD COLUMN IF NOT EXISTS action_summary TEXT;

COMMENT ON COLUMN chat_messages.action_summary IS 'Short summary of graph changes made in this assistant message (e.g. "Added nodes: Login Form; edges: ...") for context in subsequent turns.';
