# Database Seeding Instructions

## Quick Re-seed (for govproductivity database)

To apply the new shorter email addresses (`@bb.gov.in`), run these commands in order:

```bash
# 1. Clean up old data (keeps admin user, removes all others)
psql -d gov1 -f src/database/seeds/000_cleanup_data.sql

# 2. Seed admin and initial HQ users
psql -d gov1 -f src/database/seeds/001_seed_admin.sql

# 3. Seed additional HQ and Field users
psql -d gov1 -f src/database/seeds/002_seed_demo_data.sql

# 4. Seed field operations data
psql -d gov1 -f src/database/seeds/003_seed_field_data.sql

# 5. Seed field employee KPI data
psql -d gov1 -f src/database/seeds/004_seed_field_employee_kpi_data.sql

# 6. Seed organization users
psql -d gov1 -f src/database/seeds/004_seed_org_users.sql

# 7. Seed additional users (more employees, new managers)
psql -d gov1 -f src/database/seeds/006_seed_additional_users.sql

# 8. Seed additional projects, milestones, and tasks
psql -d gov1 -f src/database/seeds/007_seed_additional_projects_tasks.sql

# 9. Create teams and team_members for Field Managers
psql -d gov1 -f src/database/seeds/008_seed_field_teams.sql

# 10. Generate daily KPI data (Node.js script)
node src/database/seeds/005_seed_daily_kpi_data.js

# 11. Seed skill scores for training needs calculation
psql -d gov1 -f src/database/seeds/012_seed_skill_scores.sql
```

## Test Login Credentials (After Seeding)

After re-seeding, use these credentials:

**Admin:**
- Email: `admin@bb.gov.in`
- Password: `Admin@123`
- Role: Select any (will route to admin)

**HQ Manager:**
- Email: `rajesh@bb.gov.in`
- Password: `Manager@123`
- Role: `HQ Manager`

**HQ Employee:**
- Email: `priya@bb.gov.in`
- Password: `Employee@123`
- Role: `HQ Employee`

**Field Manager:**
- Email: `vikram@bb.gov.in`
- Password: `FieldManager@123`
- Role: `Field Manager`

**Field Employee:**
- Email: `arjun@bb.gov.in` (or any field employee email)
- Password: `FieldEmployee@123`
- Role: `Field Employee`

**New Field Managers:**
- Email: `amitabh@bb.gov.in` (Meghalaya) or `sanjay@bb.gov.in` (Manipur)
- Password: `FieldManager@123`
- Role: `Field Manager`

**New HQ Manager:**
- Email: `anil@bb.gov.in`
- Password: `Manager@123`
- Role: `HQ Manager`

## Important Notes

- **No calculations changed** - All KPI formulas remain the same
- **No mapping functionalities changed** - All role mappings remain the same
- **Only data values updated** - Email addresses shortened, user names updated for Brahmaputra Board
- **Passwords unchanged** - Same passwords, just shorter email addresses

## Troubleshooting

If login still fails after re-seeding:
1. Verify users exist: `SELECT email, role FROM users WHERE email LIKE '%@bb.gov.in';`
2. Check password hash format (should start with `$2a$` or `$2b$`)
3. Ensure `pgcrypto` extension is enabled: `CREATE EXTENSION IF NOT EXISTS pgcrypto;`

