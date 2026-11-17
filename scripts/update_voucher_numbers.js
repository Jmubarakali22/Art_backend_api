const { query } = require('../config/db');

async function updateVouchers() {
  try {
    const result = await query("UPDATE expenses SET voucher_number = REPLACE(REPLACE(voucher_number, 'EXP-', 'EXP'), '-', '') WHERE voucher_number LIKE 'EXP-%'");
    console.log('Update result:', result);

    const rows = await query('SELECT id, voucher_number, title, amount FROM expenses ORDER BY id ASC');
    console.log('Current vouchers in DB:');
    rows.forEach(r => console.log(`  ID ${r.id}: ${r.voucher_number} - ${r.title}`));
    process.exit(0);
  } catch (err) {
    console.error('Error updating vouchers:', err);
    process.exit(1);
  }
}

updateVouchers();
