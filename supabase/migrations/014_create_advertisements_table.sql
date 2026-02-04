-- Create advertisements table
CREATE TABLE IF NOT EXISTS public.advertisements (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    website_url TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('pending', 'active', 'rejected', 'expired')) DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Add RLS policies
ALTER TABLE public.advertisements ENABLE ROW LEVEL SECURITY;

-- Allow read access to everyone for active ads
CREATE POLICY "Active advertisements are viewable by everyone"
    ON public.advertisements
    FOR SELECT
    USING (status = 'active');

-- Allow users to see their own ads regardless of status
CREATE POLICY "Users can view their own advertisements"
    ON public.advertisements
    FOR SELECT
    USING (auth.uid() = user_id);

-- Allow users to create their own advertisements
CREATE POLICY "Users can create advertisements"
    ON public.advertisements
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Allow users to update their own advertisements
CREATE POLICY "Users can update their own advertisements"
    ON public.advertisements
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);
