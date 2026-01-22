-- Add is_trial column to users table for trial sales accounts
-- Trial accounts use [name].thegreentruthnyc@gmail.com format

-- Add the is_trial column to users table
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS is_trial BOOLEAN DEFAULT FALSE;

-- Add an index on is_trial for faster queries
CREATE INDEX IF NOT EXISTS idx_users_is_trial ON public.users(is_trial);

-- Comment for documentation
COMMENT ON COLUMN public.users.is_trial IS 'Indicates if this is a trial sales rep account using [name].thegreentruthnyc@gmail.com format';
