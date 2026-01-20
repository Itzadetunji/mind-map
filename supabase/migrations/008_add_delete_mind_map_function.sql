-- Function to delete a mind map and all associated chat messages
-- This function can be called from server-side code and bypasses RLS for cleanup

CREATE OR REPLACE FUNCTION delete_mind_map_with_chats(p_mind_map_id UUID, p_user_id UUID)
RETURNS VOID AS $$
DECLARE
    v_mind_map_user_id UUID;
BEGIN
    -- Verify the mind map belongs to the user (security check)
    SELECT user_id INTO v_mind_map_user_id
    FROM public.mind_maps
    WHERE id = p_mind_map_id;
    
    -- Check if mind map exists
    IF v_mind_map_user_id IS NULL THEN
        RAISE EXCEPTION 'Mind map not found';
    END IF;
    
    -- Verify ownership
    IF v_mind_map_user_id != p_user_id THEN
        RAISE EXCEPTION 'Unauthorized: Mind map does not belong to user';
    END IF;
    
    -- Delete chat messages first (though CASCADE should handle this, being explicit)
    DELETE FROM public.chat_messages
    WHERE mind_map_id = p_mind_map_id;
    
    -- Delete the mind map (this will also cascade delete chats if foreign key is set up)
    DELETE FROM public.mind_maps
    WHERE id = p_mind_map_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION delete_mind_map_with_chats(UUID, UUID) TO authenticated;

-- Note: The chat_messages table already has ON DELETE CASCADE on mind_map_id,
-- so deleting the mind_map will automatically delete associated chats.
-- This function provides explicit control and logging capabilities.
