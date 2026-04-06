-- 1. Enable RLS for registrations and salaries
ALTER TABLE registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE salaries ENABLE ROW LEVEL SECURITY;

-- 2. Policy for 'salaries' Table: Allow public READ access, nothing else.
CREATE POLICY "Allow public select on salaries"
ON salaries FOR SELECT
USING (true);

-- 3. Policy for 'registrations' Table: Allow public INSERT access, but BLOCK ALL SELECT access.
-- This ensures users can register but cannot read other people's data via the public anon key.
CREATE POLICY "Allow public insert on registrations"
ON registrations FOR INSERT
WITH CHECK (true);

-- 4. Note for 'registrations' Admin Access:
-- Since the Admin Panel currently uses the public 'anon' key to read data, 
-- enabling RLS will block its SELECT queries too.
--
-- For the Admin Panel to work while RLS is active, you have two choices:
-- Option A: Add a custom header check in the policy (Still semi-secure).
-- Option B: Implement Supabase Auth (Recommended for production).
--
-- Temporary semi-secure policy for a specific secret header:
-- (This allows admin panel SELECT only if we add a 'X-Admin-Secret' header to the query)
/*
CREATE POLICY "Allow admin select with header" 
ON registrations FOR SELECT 
USING (current_setting('request.headers', true)::json->>'x-admin-secret' = 'Numan2026');
*/
