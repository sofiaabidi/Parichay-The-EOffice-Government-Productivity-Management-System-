/**
 * Seed script to populate weekly_kpi_snapshots_field table
 * with data from the CSV file (last 30 rows)
 * Timestamps are calculated going backwards from current time (weekly intervals)
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { query } = require('../../config/database');

const seedWeeklyKpiSnapshots = async () => {
  console.log('[Seed] Starting weekly KPI snapshots field seeding...');

  // Path to the CSV file
  const csvPath = path.join(__dirname, '../../../csv_data/weekly_avg_kpi_150_rows.csv');
  
  // Alternative: if CSV is in Downloads, use that path
  const downloadsPath = path.join(process.env.HOME || process.env.USERPROFILE, 'Downloads', 'weekly_avg_kpi_150_rows.csv');
  
  let csvContent;
  if (fs.existsSync(csvPath)) {
    csvContent = fs.readFileSync(csvPath, 'utf8');
    console.log(`[Seed] Reading CSV from: ${csvPath}`);
  } else if (fs.existsSync(downloadsPath)) {
    csvContent = fs.readFileSync(downloadsPath, 'utf8');
    console.log(`[Seed] Reading CSV from: ${downloadsPath}`);
  } else {
    console.error('[Seed] CSV file not found. Please ensure weekly_avg_kpi_150_rows.csv exists in csv_data folder or Downloads folder.');
    return;
  }

  // Parse CSV
  const lines = csvContent.trim().split('\n');
  const headers = lines[0].split(',');
  const data = [];

  // Find indices
  const timestampIdx = headers.indexOf('timestamp');
  const kpiScoreIdx = headers.indexOf('average_kpi_score');

  if (timestampIdx === -1 || kpiScoreIdx === -1) {
    console.error('[Seed] CSV headers not found. Expected: timestamp, average_kpi_score');
    return;
  }

  // Parse data rows (skip header)
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',');
    if (values.length >= 2) {
      data.push({
        timestamp: values[timestampIdx].trim(),
        average_kpi_score: parseFloat(values[kpiScoreIdx].trim())
      });
    }
  }

  // Get last 30 rows (most recent 30 weeks)
  const last30Rows = data.slice(-30);
  console.log(`[Seed] Found ${data.length} total rows, using last ${last30Rows.length} rows`);

  if (last30Rows.length === 0) {
    console.error('[Seed] No data rows found in CSV');
    return;
  }

  // Calculate current date and work backwards
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Set to start of day

  // Get counts of field employees and managers for reference
  const { rows: fieldStats } = await query(`
    SELECT 
      COUNT(CASE WHEN role = 'FIELD_EMPLOYEE' THEN 1 END) as total_employees,
      COUNT(CASE WHEN role = 'FIELD_MANAGER' THEN 1 END) as total_managers
    FROM users
    WHERE role IN ('FIELD_EMPLOYEE', 'FIELD_MANAGER')
      AND is_active = TRUE
  `);

  const totalFieldEmployees = parseInt(fieldStats[0]?.total_employees || 0);
  const totalFieldManagers = parseInt(fieldStats[0]?.total_managers || 0);
  const totalFieldUsers = totalFieldEmployees + totalFieldManagers;

  console.log(`[Seed] Found ${totalFieldEmployees} field employees and ${totalFieldManagers} field managers (total: ${totalFieldUsers})`);

  // Insert data going backwards from current time
  let inserted = 0;
  let skipped = 0;

  for (let i = 0; i < last30Rows.length; i++) {
    const row = last30Rows[i];
    const kpiScore = row.average_kpi_score;

    // Calculate timestamp: go backwards from today, one week per row
    // Most recent data point is 0 weeks ago (today), oldest is 29 weeks ago
    const weeksAgo = last30Rows.length - 1 - i;
    const timestamp = new Date(today);
    timestamp.setDate(timestamp.getDate() - (weeksAgo * 7));
    
    // Set to Monday of that week (or adjust as needed)
    const dayOfWeek = timestamp.getDay();
    const diff = timestamp.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1); // Adjust to Monday
    timestamp.setDate(diff);
    timestamp.setHours(0, 0, 0, 0);

    const timestampStr = timestamp.toISOString().slice(0, 10);

    try {
      // Insert or update if exists
      await query(
        `
          INSERT INTO weekly_kpi_snapshots_field (
            timestamp,
            average_kpi_scores_of_field,
            total_field_employees,
            total_field_managers
          )
          VALUES ($1, $2, $3, $4)
          ON CONFLICT (timestamp) 
          DO UPDATE SET
            average_kpi_scores_of_field = EXCLUDED.average_kpi_scores_of_field,
            total_field_employees = EXCLUDED.total_field_employees,
            total_field_managers = EXCLUDED.total_field_managers,
            updated_at = NOW()
        `,
        [timestampStr, kpiScore, totalFieldEmployees, totalFieldManagers]
      );
      inserted++;
    } catch (err) {
      console.error(`[Seed] Error inserting row for ${timestampStr}:`, err.message);
      skipped++;
    }
  }

  console.log(`[Seed] Weekly KPI snapshots seeding complete!`);
  console.log(`[Seed] Inserted: ${inserted}, Skipped: ${skipped}`);
  console.log(`[Seed] Data range: ${last30Rows[0].timestamp} to ${last30Rows[last30Rows.length - 1].timestamp}`);
};

// Run the seed
seedWeeklyKpiSnapshots()
  .then(() => {
    console.log('[Seed] Weekly KPI snapshots field seeding finished successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('[Seed] Weekly KPI snapshots field seeding failed:', error);
    process.exit(1);
  });

