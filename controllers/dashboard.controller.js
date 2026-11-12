const { query } = require('../config/db');

exports.getStats = async (req, res) => {
  try {
    // 1. Total amount raised & total donations
    const donationStats = await query(`
      SELECT 
        COALESCE(SUM(amount), 0) AS totalDonationsAmount,
        COUNT(*) AS totalDonationsCount,
        COALESCE(SUM(CASE WHEN donation_type = 'zakat' THEN amount ELSE 0 END), 0) AS totalZakat,
        COALESCE(SUM(CASE WHEN donation_type = 'sadaqah' THEN amount ELSE 0 END), 0) AS totalSadaqah,
        COALESCE(SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END), 0) AS pendingDonationsCount
      FROM donations
    `);

    // 2. Causes count
    const causesStats = await query(`
      SELECT 
        COUNT(*) AS totalCauses,
        COALESCE(SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END), 0) AS activeCauses,
        COALESCE(SUM(target_amount), 0) AS totalTarget,
        COALESCE(SUM(raised_amount), 0) AS totalRaised
      FROM causes
    `);

    // 3. Gallery count
    const galleryStats = await query(`
      SELECT COUNT(*) AS totalPhotos FROM gallery
    `);

    // 4. Volunteers count
    const volunteerStats = await query(`
      SELECT 
        COUNT(*) AS totalVolunteers,
        COALESCE(SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END), 0) AS approvedVolunteers,
        COALESCE(SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END), 0) AS pendingVolunteers
      FROM volunteers
    `);

    // 5. Inquiries count
    const inquiryStats = await query(`
      SELECT 
        COUNT(*) AS totalInquiries,
        COALESCE(SUM(CASE WHEN status = 'unread' THEN 1 ELSE 0 END), 0) AS unreadInquiries
      FROM contact_inquiries
    `);

    // 6. Recent 5 donations
    const recentDonations = await query(`
      SELECT id, donor_name, donor_phone, amount, donation_type, payment_method, status, created_at, receipt_number
      FROM donations
      ORDER BY created_at DESC
      LIMIT 5
    `);

    // 7. Monthly donations breakdown (Last 6 months)
    const monthlyTrends = await query(`
      SELECT 
        DATE_FORMAT(created_at, '%b %Y') AS month_label,
        YEAR(created_at) as yr,
        MONTH(created_at) as mo,
        COALESCE(SUM(amount), 0) AS total_amount,
        COUNT(*) AS donation_count
      FROM donations
      GROUP BY yr, mo, month_label
      ORDER BY yr DESC, mo DESC
      LIMIT 6
    `);

    // 8. Breakdown by category/type
    const typeBreakdown = await query(`
      SELECT 
        donation_type,
        COUNT(*) AS count,
        COALESCE(SUM(amount), 0) AS total_amount
      FROM donations
      GROUP BY donation_type
    `);

    // 9. Recent Activity Logs
    const recentActivity = await query(`
      SELECT id, admin_name, action, details, created_at
      FROM activity_logs
      ORDER BY created_at DESC
      LIMIT 6
    `);

    res.json({
      success: true,
      stats: {
        totalDonationsAmount: parseFloat(donationStats[0]?.totalDonationsAmount || 0),
        totalDonationsCount: parseInt(donationStats[0]?.totalDonationsCount || 0, 10),
        totalZakat: parseFloat(donationStats[0]?.totalZakat || 0),
        totalSadaqah: parseFloat(donationStats[0]?.totalSadaqah || 0),
        pendingDonationsCount: parseInt(donationStats[0]?.pendingDonationsCount || 0, 10),
        totalCauses: parseInt(causesStats[0]?.totalCauses || 0, 10),
        activeCauses: parseInt(causesStats[0]?.activeCauses || 0, 10),
        totalTarget: parseFloat(causesStats[0]?.totalTarget || 0),
        totalRaised: parseFloat(causesStats[0]?.totalRaised || 0),
        totalPhotos: parseInt(galleryStats[0]?.totalPhotos || 0, 10),
        totalVolunteers: parseInt(volunteerStats[0]?.totalVolunteers || 0, 10),
        approvedVolunteers: parseInt(volunteerStats[0]?.approvedVolunteers || 0, 10),
        pendingVolunteers: parseInt(volunteerStats[0]?.pendingVolunteers || 0, 10),
        totalInquiries: parseInt(inquiryStats[0]?.totalInquiries || 0, 10),
        unreadInquiries: parseInt(inquiryStats[0]?.unreadInquiries || 0, 10)
      },
      recentDonations,
      monthlyTrends: monthlyTrends.reverse(),
      typeBreakdown,
      recentActivity
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};
