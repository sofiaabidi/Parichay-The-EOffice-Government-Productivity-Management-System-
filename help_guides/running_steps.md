## Running Steps

**1. Setup Database:**
```bash
cd gov-productivity-backend
npm install
cp .env.example .env  # Configure your database credentials
npm run migrate
```
Go to your SQL Shell, enter credentials and enter
```bash
USE DATABASE eoffice;
```
Make sure eoffice is added in .env file

**2. Seed Data (Run in order):**
```bash
psql -U postgres -d eoffice -f src/database/seeds/001_seed_admin.sql
psql -U postgres -d eoffice -f src/database/seeds/002_seed_demo_data.sql
psql -U postgres -d eoffice -f src/database/seeds/003_seed_field_data.sql

psql -U postgres -d eoffice -f src/database/seeds/004_seed_field_employee_kpi_data.sql
psql -U postgres -d eoffice -f src/database/seeds/004_seed_org_users.sql

node src/database/seeds/005_seed_daily_kpi_data.js

psql -U postgres -d eoffice -f src/database/seeds/006_seed_additional_users.sql
psql -U postgres -d eoffice -f src/database/seeds/007_seed_additional_projects_tasks.sql
psql -U postgres -d eoffice -f src/database/seeds/008_seed_field_teams.sql
psql -U postgres -d eoffice -f src/database/seeds/009_seed_field_employee_attendance.sql

node src/database/seeds/010_seed_weekly_kpi_snapshots_field.js
node src/database/seeds/011_seed_promotion_scores.js

psql -U postgres -d eoffice -f src/database/seeds/012_seed_skill_scores.sql
psql -U postgres -d eoffice -f src/database/seeds/032_seed_feedback_sentiment_emotion.sql
psql -U postgres -d eoffice -f src/database/seeds/fix_passwords.sql
```

**3. Start Server:**
```bash
npm start
```

**4. Go to root of repo**
```bash
cd frontend
npm install
npm run dev
```
For ML features r

### Step 2: Configuration

```bash
# create .env manually with these variables:
cat > .env <<EOF
PGHOST=127.0.0.1
PGPORT=5432
PGUSER=xxxxxxx
PGDATABASE=xxxxx
PGPASSWORD=
PORT=4000
JWT_SECRET=super-secret-key-change-in-production
JWT_EXPIRES_IN=1d
UPLOAD_DIR=uploads
FRONTEND_URLS=http://localhost:5173,http://localhost:3000
# Optional legacy single origin var (falls back to first FRONTEND_URLS entry)
# FRONTEND_URL=http://localhost:5173
EOF
```

