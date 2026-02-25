-- Migration: Add interest column to locations table
-- This allows Field Managers to specify if a location is for a Project or Survey
-- Field Employees will have NULL interest

ALTER TABLE locations 
ADD COLUMN IF NOT EXISTS interest VARCHAR(20) CHECK (interest IN ('Project', 'Survey'));

CREATE INDEX IF NOT EXISTS idx_locations_interest ON locations(interest);

