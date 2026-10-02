require('dotenv').config();
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: true });
pool.query('SELECT 1').then(() => console.log('DB Connected')).catch(console.error).finally(() => pool.end());
