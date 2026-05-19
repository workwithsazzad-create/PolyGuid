-- SQL for Course Communities

CREATE TABLE IF NOT EXISTS course_communities (
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (course_id, user_id)
);

CREATE TABLE IF NOT EXISTS community_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance and RLS
CREATE INDEX IF NOT EXISTS idx_course_communities_user ON course_communities(user_id);
CREATE INDEX IF NOT EXISTS idx_course_communities_course ON course_communities(course_id);
CREATE INDEX IF NOT EXISTS idx_community_messages_course ON community_messages(course_id);

-- RLS for course_communities
ALTER TABLE course_communities ENABLE ROW LEVEL SECURITY;

-- Allow users to see who is in a community (helpful for profile info fetching)
DROP POLICY IF EXISTS "Users can see communities they are in" ON course_communities;
CREATE POLICY "Public community membership" 
ON course_communities FOR SELECT 
USING (true); 

DROP POLICY IF EXISTS "Users can join if they want" ON course_communities;
CREATE POLICY "Users can join if they want" 
ON course_communities FOR INSERT 
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can leave" ON course_communities;
CREATE POLICY "Users can leave" 
ON course_communities FOR DELETE 
USING (auth.uid() = user_id);

-- RLS for community_messages
ALTER TABLE community_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone in community can read messages" ON community_messages;
CREATE POLICY "Anyone in community can read messages" 
ON community_messages FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM course_communities 
    WHERE course_communities.course_id = community_messages.course_id 
    AND course_communities.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Anyone in community can send messages" ON community_messages;
CREATE POLICY "Anyone in community can send messages" 
ON community_messages FOR INSERT 
WITH CHECK (
  auth.uid() = sender_id AND
  EXISTS (
    SELECT 1 FROM course_communities 
    WHERE course_communities.course_id = community_messages.course_id 
    AND course_communities.user_id = auth.uid()
  )
);

-- Admin override (if needed)
CREATE POLICY "Admins can do everything" 
ON community_messages FOR ALL
USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
