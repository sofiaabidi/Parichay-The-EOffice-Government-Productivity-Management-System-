

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { pool } = require('../config/database');
const logger = require('../utils/logger');

const runMigrations = async () => {
  // 1. Ensure migrations table exists
  await pool.query(`
    CREATE TABLE IF NOT EXISTS migrations (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) UNIQUE NOT NULL,
      run_on TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  const migrationsDir = path.join(__dirname, 'migrations');
  const files = fs
    .readdirSync(migrationsDir)
    .filter((file) => file.endsWith('.sql'))
    .sort();

  for (const file of files) {
    // Check if migration already ran
    const result = await pool.query(
      'SELECT 1 FROM migrations WHERE name = $1',
      [file]
    );

    if (result.rowCount > 0) {
      logger.info(`Skipping already applied migration: ${file}`);
      continue;
    }

    logger.info(`Running migration: ${file}`);

    const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
    await pool.query(sql);

    // Mark migration as applied
    await pool.query(
      'INSERT INTO migrations (name) VALUES ($1)',
      [file]
    );
  }
};

runMigrations()
  .then(() => {
    logger.info('Migrations completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    logger.error('Migration failed', { error });
    process.exit(1);
  });
