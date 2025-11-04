import pool from '../config/database.js';
import logger from '../utils/logger.js';

const migrations = [
  {
    name: 'create_users_table',
    query: `
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      
      CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
    `
  },
  {
    name: 'create_wallets_table',
    query: `
      CREATE TABLE IF NOT EXISTS wallets (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        address VARCHAR(42) UNIQUE NOT NULL,
        encrypted_private_key TEXT NOT NULL,
        network VARCHAR(50) DEFAULT 'sepolia',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      
      CREATE INDEX IF NOT EXISTS idx_wallets_user_id ON wallets(user_id);
      CREATE INDEX IF NOT EXISTS idx_wallets_address ON wallets(address);
    `
  },
  {
    name: 'create_transactions_table',
    query: `
      CREATE TABLE IF NOT EXISTS transactions (
        id SERIAL PRIMARY KEY,
        wallet_id INTEGER REFERENCES wallets(id) ON DELETE CASCADE,
        transaction_hash VARCHAR(66) UNIQUE NOT NULL,
        from_address VARCHAR(42) NOT NULL,
        to_address VARCHAR(42) NOT NULL,
        amount VARCHAR(78) NOT NULL,
        gas_price VARCHAR(78),
        gas_used VARCHAR(78),
        status VARCHAR(20) DEFAULT 'pending',
        block_number BIGINT,
        timestamp TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      
      CREATE INDEX IF NOT EXISTS idx_transactions_wallet_id ON transactions(wallet_id);
      CREATE INDEX IF NOT EXISTS idx_transactions_hash ON transactions(transaction_hash);
      CREATE INDEX IF NOT EXISTS idx_transactions_from ON transactions(from_address);
      CREATE INDEX IF NOT EXISTS idx_transactions_to ON transactions(to_address);
    `
  },
  {
    name: 'create_api_keys_table',
    query: `
      CREATE TABLE IF NOT EXISTS api_keys (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        key_hash VARCHAR(255) UNIQUE NOT NULL,
        name VARCHAR(255),
        last_used_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        expires_at TIMESTAMP
      );
      
      CREATE INDEX IF NOT EXISTS idx_api_keys_user_id ON api_keys(user_id);
    `
  }
];

async function runMigrations() {
  console.log(' Starting migrations...');
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    console.log(' Transaction started');
    
    console.log(' Creating migrations table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS migrations (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) UNIQUE NOT NULL,
        executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('Migrations table ready');
    

    const { rows: executedMigrations } = await client.query(
      'SELECT name FROM migrations'
    );
    const executedNames = executedMigrations.map(row => row.name);
    console.log(`Found ${executedNames.length} previously executed migrations`);
    
    for (const migration of migrations) {
      if (!executedNames.includes(migration.name)) {
        console.log(`Running migration: ${migration.name}`);
        await client.query(migration.query);
        await client.query(
          'INSERT INTO migrations (name) VALUES ($1)',
          [migration.name]
        );
        console.log(`Migration completed: ${migration.name}`);
      } else {
        console.log(`Migration already executed: ${migration.name}`);
      }
    }
    
    await client.query('COMMIT');
    console.log('All migrations completed successfully');
    console.log('Database is ready!');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Migration failed:', error.message);
    console.error('Stack:', error.stack);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Run migrations if this file is executed directly
runMigrations()
  .then(() => {
    console.log('Migration script completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Migration script failed:', error.message);
    process.exit(1);
  });