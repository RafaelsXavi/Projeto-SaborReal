import 'dotenv/config';
import pg from 'pg';
const { Pool } = pg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const res = await pool.query('select count(*) from catalog_items');
console.log('Items:', res.rows[0].count);
await pool.end();
