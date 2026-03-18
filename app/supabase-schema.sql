-- Supabase schema for Operation Dhurandhar
CREATE TABLE IF NOT EXISTS agents (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  agent_name text NOT NULL,
  referral_code text UNIQUE NOT NULL,
  recruited_by text,
  recruits_count integer DEFAULT 0,
  solved boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now()
);

-- Index for leaderboard queries
CREATE INDEX idx_agents_recruits ON agents (recruits_count DESC);

-- Index for referral lookups
CREATE INDEX idx_agents_referral ON agents (referral_code);

-- Index for counting recruits by referrer
CREATE INDEX idx_agents_recruited_by ON agents (recruited_by);

-- Enable RLS
ALTER TABLE agents ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read agents (for leaderboard)
CREATE POLICY "Allow public read" ON agents
  FOR SELECT USING (true);

-- Allow anyone to insert agents (no auth required)
CREATE POLICY "Allow public insert" ON agents
  FOR INSERT WITH CHECK (true);

-- Allow anyone to update agents (for recruit count increments)
CREATE POLICY "Allow public update" ON agents
  FOR UPDATE USING (true) WITH CHECK (true);
