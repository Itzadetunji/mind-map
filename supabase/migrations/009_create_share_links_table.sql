-- Share Links Table
-- Allows users to create shareable links for their mind maps

-- Create the share_links table
CREATE TABLE IF NOT EXISTS share_links (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    mind_map_id UUID NOT NULL REFERENCES mind_maps(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    share_token TEXT NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    -- Ensure only one share link per mind map per user
    UNIQUE(mind_map_id, user_id)
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_share_links_mind_map_id ON share_links(mind_map_id);
CREATE INDEX IF NOT EXISTS idx_share_links_user_id ON share_links(user_id);
CREATE INDEX IF NOT EXISTS idx_share_links_share_token ON share_links(share_token);
CREATE INDEX IF NOT EXISTS idx_share_links_created_at ON share_links(created_at);

-- Enable Row Level Security
ALTER TABLE share_links ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (for idempotency)
DROP POLICY IF EXISTS "Users can view own share links" ON share_links;
DROP POLICY IF EXISTS "Users can insert own share links" ON share_links;
DROP POLICY IF EXISTS "Users can update own share links" ON share_links;
DROP POLICY IF EXISTS "Users can delete own share links" ON share_links;

-- Create policies
-- Users can view their own share links
CREATE POLICY "Users can view own share links" ON share_links
    FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own share links
CREATE POLICY "Users can insert own share links" ON share_links
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own share links
CREATE POLICY "Users can update own share links" ON share_links
    FOR UPDATE USING (auth.uid() = user_id);

-- Users can delete their own share links
CREATE POLICY "Users can delete own share links" ON share_links
    FOR DELETE USING (auth.uid() = user_id);

-- Create trigger to auto-update updated_at
-- (using existing update_updated_at_column function from previous migrations)
DROP TRIGGER IF EXISTS update_share_links_updated_at ON share_links;
CREATE TRIGGER update_share_links_updated_at
    BEFORE UPDATE ON share_links
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ════════════════════════════════════════════════════════════════════════════════
-- SHARE LINK FUNCTIONS (SECURITY DEFINER - bypasses RLS for server-side operations)
-- ════════════════════════════════════════════════════════════════════════════════

-- Drop existing functions if they exist (for idempotency)
DROP FUNCTION IF EXISTS create_or_update_share_link(UUID, UUID, TEXT);
DROP FUNCTION IF EXISTS get_share_link(UUID, UUID);
DROP FUNCTION IF EXISTS revoke_share_link(UUID, UUID);
DROP FUNCTION IF EXISTS get_shared_mind_map_by_token(TEXT);

-- Function to create or update a share link
-- Verifies ownership internally and can be called with anon key
CREATE OR REPLACE FUNCTION create_or_update_share_link(
    p_mind_map_id UUID,
    p_user_id UUID,
    p_share_token TEXT
)
RETURNS TABLE (
    id UUID,
    share_token TEXT,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE
) AS $$
DECLARE
    v_mind_map_user_id UUID;
    v_existing_link_id UUID;
BEGIN
    -- Verify user owns the mind map
    SELECT mm.user_id INTO v_mind_map_user_id
    FROM mind_maps mm
    WHERE mm.id = p_mind_map_id;

    IF v_mind_map_user_id IS NULL THEN
        RAISE EXCEPTION 'Mind map not found';
    END IF;

    IF v_mind_map_user_id != p_user_id THEN
        RAISE EXCEPTION 'You do not have permission to share this mind map';
    END IF;

    -- Check if share link already exists
    SELECT sl.id INTO v_existing_link_id
    FROM share_links sl
    WHERE sl.mind_map_id = p_mind_map_id
    AND sl.user_id = p_user_id;

    IF v_existing_link_id IS NOT NULL THEN
        -- Update existing link
        UPDATE share_links sl
        SET share_token = p_share_token,
            updated_at = NOW()
        WHERE sl.id = v_existing_link_id
        RETURNING sl.id AS id, sl.share_token AS share_token, sl.created_at AS created_at, sl.updated_at AS updated_at
        INTO id, share_token, created_at, updated_at;
    ELSE
        -- Create new link
        INSERT INTO share_links (mind_map_id, user_id, share_token)
        VALUES (p_mind_map_id, p_user_id, p_share_token)
        RETURNING share_links.id AS id, share_links.share_token AS share_token, share_links.created_at AS created_at, share_links.updated_at AS updated_at
        INTO id, share_token, created_at, updated_at;
    END IF;

    RETURN NEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated and anon users
GRANT EXECUTE ON FUNCTION create_or_update_share_link(UUID, UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION create_or_update_share_link(UUID, UUID, TEXT) TO anon;

-- Function to get a share link for a mind map
CREATE OR REPLACE FUNCTION get_share_link(
    p_mind_map_id UUID,
    p_user_id UUID
)
RETURNS TABLE (
    id UUID,
    share_token TEXT,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE
) AS $$
DECLARE
    v_mind_map_user_id UUID;
BEGIN
    -- Verify user owns the mind map
    SELECT mm.user_id INTO v_mind_map_user_id
    FROM mind_maps mm
    WHERE mm.id = p_mind_map_id;

    IF v_mind_map_user_id IS NULL THEN
        RAISE EXCEPTION 'Mind map not found';
    END IF;

    IF v_mind_map_user_id != p_user_id THEN
        RAISE EXCEPTION 'You do not have permission to view this share link';
    END IF;

    -- Get share link if it exists
    RETURN QUERY
    SELECT sl.id AS id, sl.share_token AS share_token, sl.created_at AS created_at, sl.updated_at AS updated_at
    FROM share_links sl
    WHERE sl.mind_map_id = p_mind_map_id
    AND sl.user_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated and anon users
GRANT EXECUTE ON FUNCTION get_share_link(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_share_link(UUID, UUID) TO anon;

-- Function to revoke (delete) a share link
CREATE OR REPLACE FUNCTION revoke_share_link(
    p_mind_map_id UUID,
    p_user_id UUID
)
RETURNS VOID AS $$
DECLARE
    v_mind_map_user_id UUID;
BEGIN
    -- Verify user owns the mind map
    SELECT mm.user_id INTO v_mind_map_user_id
    FROM mind_maps mm
    WHERE mm.id = p_mind_map_id;

    IF v_mind_map_user_id IS NULL THEN
        RAISE EXCEPTION 'Mind map not found';
    END IF;

    IF v_mind_map_user_id != p_user_id THEN
        RAISE EXCEPTION 'You do not have permission to revoke this share link';
    END IF;

    -- Delete the share link
    DELETE FROM share_links
    WHERE mind_map_id = p_mind_map_id
    AND user_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated and anon users
GRANT EXECUTE ON FUNCTION revoke_share_link(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION revoke_share_link(UUID, UUID) TO anon;

-- Function to get shared mind map by token (public, no auth required)
CREATE OR REPLACE FUNCTION get_shared_mind_map_by_token(
    p_share_token TEXT
)
RETURNS TABLE (
    mind_map_id UUID,
    title TEXT,
    description TEXT,
    graph_data JSONB
) AS $$
DECLARE
    v_mind_map_id UUID;
BEGIN
    -- Find share link by token
    SELECT sl.mind_map_id INTO v_mind_map_id
    FROM share_links sl
    WHERE sl.share_token = p_share_token;

    IF v_mind_map_id IS NULL THEN
        RAISE EXCEPTION 'Share link not found or invalid';
    END IF;

    -- Get the mind map
    RETURN QUERY
    SELECT mm.id AS mind_map_id, mm.title AS title, mm.description AS description, mm.graph_data AS graph_data
    FROM mind_maps mm
    WHERE mm.id = v_mind_map_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to public (no auth required for viewing shared maps)
GRANT EXECUTE ON FUNCTION get_shared_mind_map_by_token(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_shared_mind_map_by_token(TEXT) TO anon;
