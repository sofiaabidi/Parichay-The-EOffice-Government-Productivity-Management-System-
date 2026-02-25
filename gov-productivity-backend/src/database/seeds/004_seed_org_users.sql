-- Seed data for HQ Organization and Field Organization users
-- This seed file creates login credentials for HQ_ORG and FIELD_ORG roles

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- HQ Organization Users
INSERT INTO users (id, name, email, password_hash, role, department, designation)
VALUES
  (998, 'HQ Organization Admin', 'hq@bb.gov.in', crypt('HQOrg@123', gen_salt('bf')), 'HQ_ORG', 'Brahmaputra Board', 'Organization Administrator'),
  (997, 'Priya Sharma', 'priya.hq@bb.gov.in', crypt('Priya@HQ123', gen_salt('bf')), 'HQ_ORG', 'Brahmaputra Board', 'Senior Organization Administrator'),
  (996, 'Arjun Patel', 'arjun.hq@bb.gov.in', crypt('Arjun@HQ123', gen_salt('bf')), 'HQ_ORG', 'Brahmaputra Board', 'Organization Administrator')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  password_hash = EXCLUDED.password_hash,
  role = EXCLUDED.role,
  department = EXCLUDED.department,
  designation = EXCLUDED.designation;

-- Field Organization Users (2 users)
INSERT INTO users (id, name, email, password_hash, role, department, designation)
VALUES
  (999, 'Field Organization Admin', 'field@bb.gov.in', crypt('FieldOrg@123', gen_salt('bf')), 'FIELD_ORG', 'Field Operations', 'Organization Administrator'),
  (995, 'Field Organization Manager', 'field.mgr@bb.gov.in', crypt('FieldOrgMgr@123', gen_salt('bf')), 'FIELD_ORG', 'Field Operations', 'Organization Manager')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  password_hash = EXCLUDED.password_hash,
  role = EXCLUDED.role,
  department = EXCLUDED.department,
  designation = EXCLUDED.designation;

-- Update sequence to ensure no conflicts
SELECT pg_catalog.setval('users_id_seq', GREATEST((SELECT MAX(id) FROM users), 1));

