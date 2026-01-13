-- Recreate chat_messages table to match new requirements

-- Drop existing table and type if they exist
DROP TABLE IF EXISTS chat_messages;
DROP TYPE IF EXISTS chat_role;

-- Create chat_role enum
CREATE TYPE chat_role AS ENUM ('user', 'ai');

-- Create chat_messages table
CREATE TABLE chat_messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    mind_map_id UUID REFERENCES mind_maps(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role chat_role NOT NULL,
    content TEXT NOT NULL,
    map_data JSONB -- Can be null
);

-- Enable RLS
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- Create policies

-- Users can view messages for their mind maps
CREATE POLICY "Users can view messages for their mind maps" ON chat_messages
    FOR SELECT USING (auth.uid() = user_id);

-- Users can insert messages for their mind maps
CREATE POLICY "Users can insert messages for their mind maps" ON chat_messages
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_chat_messages_mind_map_id ON chat_messages(mind_map_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_user_id ON chat_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON chat_messages(created_at);
