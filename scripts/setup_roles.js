const { query } = require('../config/db');

async function run() {
  try {
    console.log('[Migration] Creating roles table...');
    await query(`
      CREATE TABLE IF NOT EXISTS roles (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(50) NOT NULL UNIQUE,
        description VARCHAR(255) NULL,
        permissions JSON NULL,
        is_system TINYINT(1) DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
    console.log('[Migration] ✅ Roles table created or already exists.');

    // Check if permissions column exists in admins table
    const columns = await query("SHOW COLUMNS FROM admins LIKE 'permissions'");
    if (columns.length === 0) {
      console.log('[Migration] Adding permissions column to admins table...');
      await query("ALTER TABLE admins ADD COLUMN permissions JSON NULL AFTER role");
      console.log('[Migration] ✅ permissions column added to admins.');
    } else {
      console.log('[Migration] ✅ permissions column already exists in admins.');
    }

    // Seed default roles if empty
    const existingRoles = await query('SELECT COUNT(*) as count FROM roles');
    if (existingRoles[0].count === 0) {
      console.log('[Migration] Seeding initial standard roles...');
      const defaultRoles = [
        {
          name: 'Super Admin',
          description: 'Full unconstrained administrative access across all modules and accounts',
          permissions: JSON.stringify(['*']),
          is_system: 1
        },
        {
          name: 'Managing Trustee',
          description: 'Full management access to operations, finances, causes, and public media',
          permissions: JSON.stringify(['dashboard', 'donations', 'causes', 'gallery', 'volunteers', 'inquiries', 'settings']),
          is_system: 0
        },
        {
          name: 'Finance / Accountant',
          description: 'Access to financial donation records, receipt vouchers, and revenue stats',
          permissions: JSON.stringify(['dashboard', 'donations']),
          is_system: 0
        },
        {
          name: 'Welfare Coordinator',
          description: 'Management of charity causes, ration kits, relief programs, and inquiries',
          permissions: JSON.stringify(['dashboard', 'causes', 'volunteers', 'inquiries']),
          is_system: 0
        },
        {
          name: 'Media & Communications',
          description: 'Responsible for public photo gallery, relief events, and inquiry responses',
          permissions: JSON.stringify(['gallery', 'inquiries']),
          is_system: 0
        }
      ];

      for (const r of defaultRoles) {
        await query(
          'INSERT INTO roles (name, description, permissions, is_system) VALUES (?, ?, ?, ?)',
          [r.name, r.description, r.permissions, r.is_system]
        );
      }
      console.log('[Migration] ✅ Default roles seeded successfully.');
    }

    console.log('[Migration] Completed successfully.');
    process.exit(0);
  } catch (err) {
    console.error('[Migration Error]:', err);
    process.exit(1);
  }
}

run();
