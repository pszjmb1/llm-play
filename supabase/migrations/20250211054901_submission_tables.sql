/*
 * Copyright 2025 LLM-Play Contributors
 *
 * Migration Name: create_submission_tables
 * Description: Creates and documents the core tables for the submission system
 * 
 * The environments table stores submitted LLM environments and their metadata.
 * The jobs table tracks the execution and testing of these environments.
 * Both tables use RLS (Row Level Security) to control access.
 *
 * Version: 1.0
 * Created: 2025-02-11
 */
 
 -- Table DDLs
CREATE TABLE environments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  file_url TEXT,
  metadata JSONB,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
COMMENT ON TABLE environments IS 
'Stores submitted LLM environments including metadata and current status. Each environment represents a reinforcement learning challenge that can be run against language models.';

COMMENT ON COLUMN environments.id IS 'Unique identifier for the environment submission';
COMMENT ON COLUMN environments.user_id IS 'Foreign key to auth.users - the user who submitted the environment';
COMMENT ON COLUMN environments.name IS 'Human-readable name of the environment';
COMMENT ON COLUMN environments.description IS 'Detailed description of what the environment tests or measures';
COMMENT ON COLUMN environments.file_url IS 'Optional URL pointing to the environment implementation file in storage';
COMMENT ON COLUMN environments.metadata IS 'JSON field for flexible storage of environment-specific metadata';
COMMENT ON COLUMN environments.status IS 'Current status of the environment (e.g., pending, active, archived)';
COMMENT ON COLUMN environments.created_at IS 'Timestamp when the environment was submitted';

CREATE TABLE jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  environment_id UUID REFERENCES environments(id) NOT NULL,
  status TEXT NOT NULL DEFAULT 'queued',
  result JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
COMMENT ON TABLE jobs IS 
'Tracks the execution status and results of environment test runs. Each job is associated with exactly one environment and maintains its full testing lifecycle.';

COMMENT ON COLUMN jobs.id IS 'Unique identifier for the job';
COMMENT ON COLUMN jobs.environment_id IS 'Foreign key to environments table - the environment being tested';
COMMENT ON COLUMN jobs.status IS 'Current status of the job (queued, running, completed, failed)';
COMMENT ON COLUMN jobs.result IS 'JSON field containing the test results and any output data';
COMMENT ON COLUMN jobs.created_at IS 'Timestamp when the job was created';
COMMENT ON COLUMN jobs.updated_at IS 'Timestamp when the job was last updated';

-- Enable RLS
ALTER TABLE environments ENABLE ROW LEVEL SECURITY;
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Enable read access for all users" ON environments
  FOR SELECT USING (true);
COMMENT ON POLICY "Enable read access for all users" ON environments IS 
'Allows all users (authenticated or not) to view environment submissions.';

CREATE POLICY "Enable insert access for authenticated users" ON environments
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');
COMMENT ON POLICY "Enable insert access for authenticated users" ON environments IS 
'Allows only authenticated users to submit new environments.';

CREATE POLICY "Enable read access for all users" ON jobs
  FOR SELECT USING (true);
COMMENT ON POLICY "Enable read access for all users" ON jobs IS 
'Allows all users (authenticated or not) to view job statuses and results.';      

-- Functions

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';
COMMENT ON FUNCTION update_updated_at_column() IS 
'Trigger function to automatically update the updated_at timestamp whenever a row is modified. This ensures we always have an accurate last-modified time.

Usage:
- Automatically called via trigger before updates
- Sets NEW.updated_at to current timestamp
- Used by jobs table to track when job status changes

Parameters: None
Returns: trigger
';

-- Triggers
CREATE TRIGGER update_jobs_updated_at
    BEFORE UPDATE ON jobs
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();

COMMENT ON TRIGGER update_jobs_updated_at ON jobs IS 
'Automatically updates the updated_at column whenever a job record is modified.';