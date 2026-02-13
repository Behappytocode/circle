
-- Enable Realtime for relevant tables
-- Run these individually if your Supabase UI doesn't allow multi-statement Realtime setup.
-- alter publication supabase_realtime add table public.profiles;
-- alter publication supabase_realtime add table public.messages;
-- alter publication supabase_realtime add table public.groups;
-- alter publication supabase_realtime add table public.group_members;

-- 1. PROFILES TABLE
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  avatar_url TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'banned')),
  is_admin BOOLEAN DEFAULT FALSE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. GROUPS TABLE
CREATE TABLE IF NOT EXISTS public.groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. GROUP MEMBERS TABLE
CREATE TABLE IF NOT EXISTS public.group_members (
  group_id UUID REFERENCES public.groups(id) ON DELETE CASCADE,
  profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'member',
  PRIMARY KEY (group_id, profile_id)
);

-- 4. MESSAGES TABLE
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID REFERENCES public.profiles(id) NOT NULL,
  receiver_id UUID REFERENCES public.profiles(id), -- Null for group messages
  group_id UUID REFERENCES public.groups(id),      -- Null for direct messages
  content TEXT,
  media_url TEXT,
  audio_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ROW LEVEL SECURITY (RLS) Policies

-- Profiles: Admin can see all, Users can see approved profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read of basic profile info" ON public.profiles
  FOR SELECT USING (status = 'approved' OR id = auth.uid() OR (SELECT is_admin FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Admins can update any profile" ON public.profiles
  FOR UPDATE USING ((SELECT is_admin FROM public.profiles WHERE id = auth.uid()));

-- Groups: Approved members only
ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Approved members can view groups" ON public.groups
  FOR SELECT USING ((SELECT status FROM public.profiles WHERE id = auth.uid()) = 'approved');

CREATE POLICY "Approved members can create groups" ON public.groups
  FOR INSERT WITH CHECK ((SELECT status FROM public.profiles WHERE id = auth.uid()) = 'approved');

-- Messages: Complex RLS
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read messages in their groups or DMs" ON public.messages
  FOR SELECT USING (
    (SELECT status FROM public.profiles WHERE id = auth.uid()) = 'approved' AND (
      sender_id = auth.uid() OR
      receiver_id = auth.uid() OR
      group_id IN (SELECT group_id FROM public.group_members WHERE profile_id = auth.uid())
    )
  );

CREATE POLICY "Approved users can send messages" ON public.messages
  FOR INSERT WITH CHECK (
    (SELECT status FROM public.profiles WHERE id = auth.uid()) = 'approved' AND
    sender_id = auth.uid()
  );

-- STORAGE BUCKETS
-- (Manual Setup via Supabase Console recommended for Buckets: 'media', 'audio')
-- Ensure RLS on Storage follows similar 'Approved only' rules.

-- Function to handle new user profile creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username, avatar_url, status, is_admin)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'username', 'user_' || substr(new.id::text, 1, 8)),
    new.raw_user_meta_data->>'avatar_url',
    'pending',
    FALSE
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for profile creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
