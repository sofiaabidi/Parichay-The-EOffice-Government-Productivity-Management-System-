-- Migration: Add HQ_ORG and FIELD_ORG roles
-- This migration safely updates the users.role CHECK constraint to include the new organization roles

-- Step 1: Drop the existing CHECK constraint on role
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;

-- Step 2: Add the new CHECK constraint with all roles (existing + new)
ALTER TABLE users ADD CONSTRAINT users_role_check 
  CHECK (role IN ('EMPLOYEE', 'MANAGER', 'ADMIN', 'FIELD_MANAGER', 'FIELD_EMPLOYEE', 'HQ_ORG', 'FIELD_ORG'));

