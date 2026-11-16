const { query } = require('../config/db');

async function cleanSampleExpenses() {
  console.log('Cleaning sample seed expenses from database...');

  // Delete initial demo seed records (1, 2, 3, 4)
  const delRes = await query('DELETE FROM expenses WHERE id IN (1, 2, 3, 4)');
  console.log('Deleted demo records 1, 2, 3, 4:', delRes);

  // Update real user entry (Teacher Salaries) to start at EXP-2026-0001
  await query("UPDATE expenses SET voucher_number = 'EXP-2026-0001' WHERE id = 30001");

  // Fetch remaining real records
  const remaining = await query('SELECT id, title, category, amount, payment_method, voucher_number, status FROM expenses');
  console.log('Real expenses remaining in database:', remaining);

  // Calculate new summary
  const summaryRows = await query(`
    SELECT 
      COALESCE(SUM(amount), 0) as overall_total,
      COALESCE(SUM(CASE WHEN LOWER(category) LIKE '%tailor%' THEN amount ELSE 0 END), 0) as tailoring_total,
      COALESCE(SUM(CASE WHEN LOWER(category) LIKE '%ration%' AND LOWER(category) NOT LIKE '%monthly%' THEN amount ELSE 0 END), 0) as ration_kit_total,
      COALESCE(SUM(CASE WHEN LOWER(category) LIKE '%monthly%ration%' OR LOWER(category) LIKE '%monthly%food%' THEN amount ELSE 0 END), 0) as monthly_ration_kit_total,
      COUNT(*) as total_count
    FROM expenses
  `);
  console.log('New Live Summary:', summaryRows[0]);

  process.exit(0);
}

cleanSampleExpenses().catch((err) => {
  console.error('Error cleaning sample expenses:', err);
  process.exit(1);
});
