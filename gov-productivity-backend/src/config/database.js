const { Pool } = require('pg');
const logger = require('../utils/logger');

const pool = new Pool({
  host: process.env.PGHOST || 'localhost',
  port: Number(process.env.PGPORT) || 5432,
  database: process.env.PGDATABASE || 'gov_productivity',
  user: process.env.PGUSER || 'postgres',
  password: process.env.PGPASSWORD || 'postgres',
  max: 20,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 10_000, // Increased from 5s to 10s to handle concurrent operations
  statement_timeout: 60_000, // 60 second statement timeout
  query_timeout: 60_000, // 60 second query timeout
});

pool.on('connect', async (client) => {
  try {
    await client.query("SET TIME ZONE 'UTC'");
  } catch (error) {
    logger.warn('Failed to set timezone for client', { error });
  }
});

pool.on('error', (error) => {
  logger.error('Unexpected database error', { error });
});

const testConnection = async () => {
  const client = await pool.connect();
  try {
    const result = await client.query('SELECT NOW()');
    logger.info('Database connection established', { at: result.rows[0].now });
    return true;
  } catch (error) {
    logger.error('Database connection test failed', { error });
    return false;
  } finally {
    client.release();
  }
};

const query = (text, params = []) => pool.query(text, params);
const getClient = () => pool.connect();

module.exports = {
  pool,
  query,
  getClient,
  testConnection,
};
