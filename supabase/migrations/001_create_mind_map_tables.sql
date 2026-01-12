-- Mind Map Projects Table
-- Run this in your Supabase SQL Editor

-- Create the mind_map_projects table
CREATE TABLE IF NOT EXISTS mind_map_projects (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    prompt TEXT NOT NULL,
    graph_data JSONB NOT NULL DEFAULT '{"nodes": [], "edges": []}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster user queries
CREATE INDEX IF NOT EXISTS idx_mind_map_projects_user_id ON mind_map_projects(user_id);
CREATE INDEX IF NOT EXISTS idx_mind_map_projects_updated_at ON mind_map_projects(updated_at DESC);

-- Enable Row Level Security
ALTER TABLE mind_map_projects ENABLE ROW LEVEL SECURITY;

-- Create policies
-- Users can only see their own projects
CREATE POLICY "Users can view own projects" ON mind_map_projects
    FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own projects
CREATE POLICY "Users can insert own projects" ON mind_map_projects
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own projects
CREATE POLICY "Users can update own projects" ON mind_map_projects
    FOR UPDATE USING (auth.uid() = user_id);

-- Users can delete their own projects
CREATE POLICY "Users can delete own projects" ON mind_map_projects
    FOR DELETE USING (auth.uid() = user_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to auto-update updated_at
DROP TRIGGER IF EXISTS update_mind_map_projects_updated_at ON mind_map_projects;
CREATE TRIGGER update_mind_map_projects_updated_at
    BEFORE UPDATE ON mind_map_projects
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Chat Messages Table (optional, for persisting chat history)
CREATE TABLE IF NOT EXISTS chat_messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id UUID NOT NULL REFERENCES mind_map_projects(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
    content TEXT NOT NULL,
    thinking_steps JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster chat queries
CREATE INDEX IF NOT EXISTS idx_chat_messages_project_id ON chat_messages(project_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON chat_messages(created_at);

-- Enable Row Level Security for chat messages
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- Chat messages inherit access from their parent project
CREATE POLICY "Users can view chat messages for own projects" ON chat_messages
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM mind_map_projects 
            WHERE mind_map_projects.id = chat_messages.project_id 
            AND mind_map_projects.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert chat messages for own projects" ON chat_messages
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM mind_map_projects 
            WHERE mind_map_projects.id = chat_messages.project_id 
            AND mind_map_projects.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete chat messages for own projects" ON chat_messages
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM mind_map_projects 
            WHERE mind_map_projects.id = chat_messages.project_id 
            AND mind_map_projects.user_id = auth.uid()
        )
    );
