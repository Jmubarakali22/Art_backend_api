const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '../.env') });

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: 'test',
  port: parseInt(process.env.DB_PORT || '3306', 10),
  multipleStatements: true,
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : undefined
};

async function initDatabase() {
  console.log('[InitDb] Starting MySQL database initialization for Ar Rahman Trust...');

  let connection;
  try {
    connection = await mysql.createConnection(dbConfig);
    console.log('[InitDb] Connected to MySQL server.');

    // 1. Create Database if not exists
    const dbName = process.env.DB_NAME || 'ar_rahman_trust_db';
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`);
    await connection.query(`USE \`${dbName}\`;`);
    console.log(`[InitDb] Database "${dbName}" verified/created.`);

    // 2. Read schema.sql and execute
    const schemaPath = path.join(__dirname, 'schema.sql');
    if (fs.existsSync(schemaPath)) {
      const schemaSql = fs.readFileSync(schemaPath, 'utf8');
      await connection.query(schemaSql);
      console.log('[InitDb] Schema tables created successfully.');
    }

    // 3. Check if admins table has any rows. If empty, seed data
    const [rows] = await connection.query('SELECT COUNT(*) as count FROM admins;');
    if (rows[0].count === 0) {
      console.log('[InitDb] Database is empty. Seeding initial data...');
      const seedPath = path.join(__dirname, 'seed.sql');
      if (fs.existsSync(seedPath)) {
        const seedSql = fs.readFileSync(seedPath, 'utf8');
        await connection.query(seedSql);
        console.log('[InitDb] Seed data inserted successfully!');
      }

      // Hash default admin password with bcrypt
      const hashedPassword = await bcrypt.hash('password123', 10);
      await connection.query(
        'UPDATE admins SET password = ? WHERE username IN ("admin", "trustee");',
        [hashedPassword]
      );
      console.log('[InitDb] Default admin passwords updated to hashed "password123".');
    } else {
      console.log(`[InitDb] Database already contains ${rows[0].count} admin account(s). Skipping initial seed.`);
    }

    console.log('[InitDb] Database initialization completed successfully!');
    console.log('----------------------------------------------------');
    console.log('Default Login:');
    console.log('  Username: admin');
    console.log('  Password: password123');
    console.log('----------------------------------------------------');
  } catch (error) {
    console.error('[InitDb Error]:', error.message);
    if (error.code === 'ECONNREFUSED') {
      console.error('>> Could not connect to MySQL server. Please make sure MySQL (XAMPP / MySQL service) is running on port 3306.');
    }
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

if (require.main === module) {
  initDatabase();
}

module.exports = initDatabase;
