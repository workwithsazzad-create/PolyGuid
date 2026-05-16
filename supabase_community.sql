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

-- RLS for course_communities
ALTER TABLE course_communities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can see communities they are in" 
ON course_communities FOR SELECT 
USING (true); 

CREATE POLICY "Users can join if they want" 
ON course_communities FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can leave" 
ON course_communities FOR DELETE 
USING (auth.uid() = user_id);

-- RLS for community_messages
ALTER TABLE community_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone in community can read messages" 
ON community_messages FOR SELECT 
USING (
  EXISTS (SELECT 1 FROM course_communities WHERE course_id = community_messages.course_id AND user_id = auth.uid()) OR auth.uid() = sender_id
);

CREATE POLICY "Anyone in community can send messages" 
ON community_messages FOR INSERT 
WITH CHECK (
  auth.uid() = sender_id AND
  EXISTS (SELECT 1 FROM course_communities WHERE course_id = community_messages.course_id AND user_id = auth.uid())
);
