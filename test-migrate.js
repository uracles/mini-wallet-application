console.log('Script started');

import pool from './src/config/database.js';

console.log('Imports loaded');

async function test() {
  console.log('Test function started');
  try {
    console.log('Attempting database connection...');
    const client = await pool.connect();
    console.log('✅ Connected to database!');
    
    const result = await client.query('SELECT NOW()');
    console.log('✅ Query executed:', result.rows[0]);
    
    client.release();
    await pool.end();
    console.log('✅ Connection closed');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Full error:', error);
    process.exit(1);
  }
}

test();