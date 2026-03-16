ALTER TABLE service_assignments
  ADD COLUMN IF NOT EXISTS round2_unlocked BOOLEAN NOT NULL DEFAULT false;
