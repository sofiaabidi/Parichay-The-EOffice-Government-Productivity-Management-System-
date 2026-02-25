-- Fix password hashes for users to ensure compatibility with bcryptjs
-- This regenerates password hashes using PostgreSQL's crypt() function
-- which should be compatible with bcryptjs

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Update password hashes for all users with the correct passwords
UPDATE users SET password_hash = crypt('Admin@123', gen_salt('bf')) WHERE id = 1 AND email = 'admin@bb.gov.in';
UPDATE users SET password_hash = crypt('Manager@123', gen_salt('bf')) WHERE id = 2 AND email = 'rajesh@bb.gov.in';
UPDATE users SET password_hash = crypt('Employee@123', gen_salt('bf')) WHERE id = 3 AND email = 'priya@bb.gov.in';
UPDATE users SET password_hash = crypt('Employee@123', gen_salt('bf')) WHERE id = 4 AND email = 'amit@bb.gov.in';
UPDATE users SET password_hash = crypt('Manager@123', gen_salt('bf')) WHERE id = 5 AND email = 'suresh@bb.gov.in';
UPDATE users SET password_hash = crypt('Employee@123', gen_salt('bf')) WHERE id = 6 AND email = 'neha@bb.gov.in';
UPDATE users SET password_hash = crypt('Employee@123', gen_salt('bf')) WHERE id = 7 AND email = 'kiran@bb.gov.in';
UPDATE users SET password_hash = crypt('Employee@123', gen_salt('bf')) WHERE id = 8 AND email = 'deepak@bb.gov.in';
UPDATE users SET password_hash = crypt('FieldManager@123', gen_salt('bf')) WHERE id = 9 AND email = 'vikram@bb.gov.in';
UPDATE users SET password_hash = crypt('FieldEmployee@123', gen_salt('bf')) WHERE id = 10 AND email = 'arjun@bb.gov.in';
UPDATE users SET password_hash = crypt('FieldEmployee@123', gen_salt('bf')) WHERE id = 11 AND email = 'priya.das@bb.gov.in';
UPDATE users SET password_hash = crypt('FieldEmployee@123', gen_salt('bf')) WHERE id = 12 AND email = 'amit.kumar@bb.gov.in';
UPDATE users SET password_hash = crypt('FieldEmployee@123', gen_salt('bf')) WHERE id = 13 AND email = 'sneha@bb.gov.in';
UPDATE users SET password_hash = crypt('FieldManager@123', gen_salt('bf')) WHERE id = 14 AND email = 'rajesh.singh@bb.gov.in';
UPDATE users SET password_hash = crypt('FieldEmployee@123', gen_salt('bf')) WHERE id = 15 AND email = 'neha.verma@bb.gov.in';
UPDATE users SET password_hash = crypt('FieldEmployee@123', gen_salt('bf')) WHERE id = 16 AND email = 'rohit@bb.gov.in';
UPDATE users SET password_hash = crypt('FieldEmployee@123', gen_salt('bf')) WHERE id = 17 AND email = 'kavita@bb.gov.in';
UPDATE users SET password_hash = crypt('FieldOrgMgr@123', gen_salt('bf')) WHERE id = 995 AND email = 'field.mgr@bb.gov.in';
UPDATE users SET password_hash = crypt('Arjun@HQ123', gen_salt('bf')) WHERE id = 996 AND email = 'arjun.hq@bb.gov.in';
UPDATE users SET password_hash = crypt('Priya@HQ123', gen_salt('bf')) WHERE id = 997 AND email = 'priya.hq@bb.gov.in';
UPDATE users SET password_hash = crypt('HQOrg@123', gen_salt('bf')) WHERE id = 998 AND email = 'hq@bb.gov.in';
UPDATE users SET password_hash = crypt('FieldOrg@123', gen_salt('bf')) WHERE id = 999 AND email = 'field@bb.gov.in';

-- Verify updates
SELECT id, email, LEFT(password_hash, 10) as hash_prefix FROM users WHERE email LIKE '%@bb.gov.in' ORDER BY id;

