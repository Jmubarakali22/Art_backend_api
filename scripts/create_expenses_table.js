const { query } = require('../config/db');

async function createExpensesTable() {
  console.log('Creating expenses table...');
  const createTableSql = `
    CREATE TABLE IF NOT EXISTS \`expenses\` (
      \`id\` INT AUTO_INCREMENT PRIMARY KEY,
      \`title\` VARCHAR(255) NOT NULL,
      \`category\` VARCHAR(100) NOT NULL,
      \`amount\` DECIMAL(12,2) NOT NULL,
      \`expense_date\` DATE NOT NULL,
      \`payment_method\` VARCHAR(50) DEFAULT 'Cash',
      \`vendor_payee\` VARCHAR(200) DEFAULT NULL,
      \`voucher_number\` VARCHAR(100) DEFAULT NULL,
      \`receipt_url\` VARCHAR(500) DEFAULT NULL,
      \`status\` VARCHAR(50) DEFAULT 'Paid',
      \`notes\` TEXT DEFAULT NULL,
      \`recorded_by\` VARCHAR(100) DEFAULT NULL,
      \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      \`updated_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `;

  await query(createTableSql);
  console.log('✅ Expenses table created or verified.');

  // Check if any expenses exist
  const existing = await query('SELECT COUNT(*) as count FROM expenses');
  if (existing[0].count === 0) {
    console.log('Seeding initial expense records...');
    const seedRecords = [
      [
        'Tailoring Class Machine Maintenance & Needles',
        'Tailoring',
        3500.00,
        '2026-11-10',
        'UPI',
        'S.K. Sewing Solutions',
        'EXP-2026-0001',
        null,
        'Paid',
        'Routine servicing of 6 sewing machines and replacement of bobbins and needle sets.',
        'Super Admin'
      ],
      [
        'Monthly Grocery Bags & Packaging Materials',
        'Monthly Ration Kit',
        18500.00,
        '2026-11-08',
        'Bank Transfer',
        'Al-Madina Rice & Grocery Mart',
        'EXP-2026-0002',
        null,
        'Verified',
        'Purchase of 100 bags of 10kg Sona Masoori rice, toor dal, and oil packs for Pernambut beneficiaries.',
        'Super Admin'
      ],
      [
        'Emergency Flood Relief Ration Kits',
        'Ration Kit',
        12000.00,
        '2026-11-05',
        'Cash',
        'Pernambut Wholesale Provisions',
        'EXP-2026-0003',
        null,
        'Paid',
        'Essential ration supplies for 40 daily wage families during heavy monsoon rains.',
        'Super Admin'
      ],
      [
        'Tailoring Fabric, Thread Rolls & Scissors Batch',
        'Tailoring',
        6800.00,
        '2026-11-02',
        'UPI',
        'Noor Textiles & Haberdashery',
        'EXP-2026-0004',
        null,
        'Paid',
        'Course learning materials for women students enrolled in batch 4 tailoring training.',
        'Super Admin'
      ]
    ];

    for (const record of seedRecords) {
      await query(
        `INSERT INTO expenses (title, category, amount, expense_date, payment_method, vendor_payee, voucher_number, receipt_url, status, notes, recorded_by)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        record
      );
    }
    console.log('✅ Seeded 4 sample expense records.');
  } else {
    console.log(`Table already has ${existing[0].count} expenses.`);
  }

  process.exit(0);
}

createExpensesTable().catch(err => {
  console.error('Error creating expenses table:', err);
  process.exit(1);
});
