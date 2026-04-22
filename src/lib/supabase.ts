import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase credentials missing. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your environment.');
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key'
);

/**
 * SQL Schema for Supabase:
 * 
 * -- Profiles table
 * create table profiles (
 *   id uuid references auth.users on delete cascade primary key,
 *   email text unique,
 *   full_name text,
 *   role text default 'student',
 *   created_at timestamp with time zone default timezone('utc'::text, now()) not null
 * );
 * 
 * -- Courses table
 * create table courses (
 *   id uuid default uuid_generate_v4() primary key,
 *   title text not null,
 *   description text,
 *   price numeric default 0,
 *   thumbnail_url text,
 *   is_premium boolean default false,
 *   created_at timestamp with time zone default timezone('utc'::text, now()) not null
 * );
 * 
 * -- Course Content table
 * create table course_content (
 *   id uuid default uuid_generate_v4() primary key,
 *   course_id uuid references courses(id) on delete cascade,
 *   title text not null,
 *   video_url text,
 *   pdf_url text,
 *   order_index int default 0,
 *   created_at timestamp with time zone default timezone('utc'::text, now()) not null
 * );
 * 
 * -- RLS Policies (Simplified for demo)
 * alter table profiles enable row level security;
 * create policy "Public profiles are viewable by everyone." on profiles for select using (true);
 * create policy "Users can update own profile." on profiles for update using (auth.uid() = id);
 * 
 * alter table courses enable row level security;
 * create policy "Courses are viewable by everyone." on courses for select using (true);
 * create policy "Only admins can modify courses." on courses for all using (
 *   exists (select 1 from profiles where id = auth.uid() and role = 'admin')
 * );
 * 
 * -- Saved Items table
 * create table saved_items (
 *   id uuid default uuid_generate_v4() primary key,
 *   user_id uuid references auth.users on delete cascade,
 *   content_id uuid references course_content(id) on delete cascade,
 *   item_type text check (item_type in ('video', 'pdf')),
 *   created_at timestamp with time zone default timezone('utc'::text, now()) not null,
 *   unique(user_id, content_id)
 * );
 * 
 * alter table saved_items enable row level security;
 * create policy "Users can manage own saved items" on saved_items for all using (auth.uid() = user_id);
 */
