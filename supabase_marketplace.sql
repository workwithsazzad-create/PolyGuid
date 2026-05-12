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


-- Create marketplace bucket for images
INSERT INTO storage.buckets (id, name, public) VALUES ('marketplace', 'marketplace', true) ON CONFLICT DO NOTHING;

-- RLS for storage bucket
CREATE POLICY "Marketplace images are publicly accessible" ON storage.objects FOR SELECT USING (bucket_id = 'marketplace');
CREATE POLICY "Users can upload marketplace images" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'marketplace' AND auth.role() = 'authenticated');
CREATE POLICY "Users can delete own marketplace images" ON storage.objects FOR DELETE USING (bucket_id = 'marketplace' AND auth.role() = 'authenticated' AND owner = auth.uid());
