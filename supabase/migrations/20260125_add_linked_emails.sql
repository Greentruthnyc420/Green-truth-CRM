-- Add linked_emails column to users table
-- This allows users to login with either their original trial email or their upgraded business email

ALTER TABLE users ADD COLUMN IF NOT EXISTS linked_emails text[] DEFAULT '{}';

-- Create an index for efficient lookup of linked emails
CREATE INDEX IF NOT EXISTS idx_users_linked_emails ON users USING GIN (linked_emails);

-- Add a comment explaining the column
COMMENT ON COLUMN users.linked_emails IS 'Array of additional emails that can be used to login to this account (e.g., old trial emails after upgrade to business email)';
