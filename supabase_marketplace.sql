-- Run this SQL in your Supabase SQL Editor

CREATE TABLE IF NOT EXISTS public.marketplace_books (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  title TEXT NOT NULL,
  semester TEXT NOT NULL,
  department TEXT NOT NULL,
  price NUMERIC NOT NULL,
  description TEXT,
  phone TEXT NOT NULL,
  whatsapp TEXT,
  district TEXT NOT NULL,
  upazila TEXT NOT NULL,
  image_url TEXT NOT NULL,
  status TEXT DEFAULT 'active',
  views INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.marketplace_books ENABLE ROW LEVEL SECURITY;

-- Allow public read access
CREATE POLICY "Marketplace books viewable by everyone" ON public.marketplace_books
  FOR SELECT USING (true);

-- Allow authenticated users to insert their own books
CREATE POLICY "Users can insert own books" ON public.marketplace_books
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Allow users to update their own books
CREATE POLICY "Users can update own books" ON public.marketplace_books
  FOR UPDATE USING (auth.uid() = user_id);

-- Allow users to delete their own books
CREATE POLICY "Users can delete own books" ON public.marketplace_books
  FOR DELETE USING (auth.uid() = user_id);


-- Delete all notifications as requested
DELETE FROM public.notifications;

-- Create verification_applications table
CREATE TABLE IF NOT EXISTS public.verification_applications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  full_name TEXT NOT NULL,
  phone_number TEXT NOT NULL,
  id_card_front_url TEXT,
  id_card_back_url TEXT,
  status TEXT DEFAULT 'pending', -- pending, approved, rejected
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for verification_applications
ALTER TABLE public.verification_applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own application" ON public.verification_applications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own application" ON public.verification_applications
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Add is_verified to profiles table if it doesn't exist
-- Note: This might fail if the column already exists, but Supabase handles it if we use DO block or just try.
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT FALSE;

-- Create verifications bucket for IDs
INSERT INTO storage.buckets (id, name, public) VALUES ('verifications', 'verifications', true) ON CONFLICT DO NOTHING;

-- RLS for verifications bucket
CREATE POLICY "Verification images are viewable by owner" ON storage.objects FOR SELECT USING (bucket_id = 'verifications' AND (auth.uid() = owner OR auth.role() = 'authenticated'));
CREATE POLICY "Users can upload verification images" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'verifications' AND auth.role() = 'authenticated');
CREATE POLICY "Users can delete own verification images" ON storage.objects FOR DELETE USING (bucket_id = 'verifications' AND auth.role() = 'authenticated' AND owner = auth.uid());

