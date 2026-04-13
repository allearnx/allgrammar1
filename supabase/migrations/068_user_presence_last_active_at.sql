-- Add last_active_at for lightweight presence tracking (live monitor)
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_active_at TIMESTAMPTZ;

-- Index for efficient "online" queries
CREATE INDEX idx_users_last_active_at ON users(last_active_at)
  WHERE last_active_at IS NOT NULL;
