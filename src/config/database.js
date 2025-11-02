// import pg from 'pg';
// import dotenv from 'dotenv';
// import logger from '../utils/logger.js';

// dotenv.config();

// const { Pool } = pg;

// const poolConfig = {
//   connectionString: process.env.DATABASE_URL,
//   // ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
//   ssl: { rejectUnauthorized: true },
//   max: 20,
//   idleTimeoutMillis: 30000,
//   connectionTimeoutMillis: 2000,
// };

// const pool = new Pool(poolConfig);

// pool.on('connect', () => {
//   logger.info('Database connection established');
// });

// pool.on('error', (err) => {
//   logger.error('Unexpected database error', err);
//   process.exit(-1);
// });

// export const query = async (text, params) => {
//   const start = Date.now();
//   try {
//     const res = await pool.query(text, params);
//     const duration = Date.now() - start;
//     logger.debug('Executed query', { text, duration, rows: res.rowCount });
//     return res;
//   } catch (error) {
//     logger.error('Database query error', { text, error: error.message });
//     throw error;
//   }
// };

// export const getClient = async () => {
//   const client = await pool.connect();
//   const query = client.query.bind(client);
//   const release = client.release.bind(client);

//   // Set a timeout of 5 seconds, after which we will log this client's last query
//   const timeout = setTimeout(() => {
//     logger.error('A client has been checked out for more than 5 seconds!');
//   }, 5000);

//   client.query = (...args) => {
//     clearTimeout(timeout);
//     return query(...args);
//   };

//   client.release = () => {
//     clearTimeout(timeout);
//     client.query = query;
//     client.release = release;
//     return release();
//   };

//   return client;
// };

// export default pool;


import pg from 'pg';
import dotenv from 'dotenv';
import logger from '../utils/logger.js';

dotenv.config();

const { Pool } = pg;

// Use individual parameters instead of connection string
const poolConfig = {
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  ssl: {
    rejectUnauthorized: false
  },
  max: 20,
  idleTimeoutMillis: 60000,
  connectionTimeoutMillis: 30000,
  keepAlive: true
};

const pool = new Pool(poolConfig);

pool.on('connect', () => {
  logger.info('Database connection established');
});

pool.on('error', (err) => {
  logger.error('Unexpected database error', err);
});

export const query = async (text, params) => {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    logger.debug('Executed query', { text, duration, rows: res.rowCount });
    return res;
  } catch (error) {
    logger.error('Database query error', { text, error: error.message });
    throw error;
  }
};

export const getClient = async () => {
  const client = await pool.connect();
  const query = client.query.bind(client);
  const release = client.release.bind(client);

  const timeout = setTimeout(() => {
    logger.error('A client has been checked out for more than 5 seconds!');
  }, 5000);

  client.query = (...args) => {
    clearTimeout(timeout);
    return query(...args);
  };

  client.release = () => {
    clearTimeout(timeout);
    client.query = query;
    client.release = release;
    return release();
  };

  return client;
};

export default pool;