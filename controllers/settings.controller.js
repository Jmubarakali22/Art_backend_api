const { query } = require('../config/db');

exports.getAll = async (req, res) => {
  try {
    const rows = await query('SELECT * FROM trust_settings');
    const settings = {};
    rows.forEach(r => {
      settings[r.setting_key] = r.setting_value;
    });
    res.json({ success: true, settings, rows });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.update = async (req, res) => {
  try {
    const settings = req.body; // e.g. { trust_name: '...', upi_id: '...' }

    for (const [key, value] of Object.entries(settings)) {
      await query(
        `INSERT INTO trust_settings (setting_key, setting_value) 
         VALUES (?, ?) 
         ON DUPLICATE KEY UPDATE setting_value = ?`,
        [key, value, value]
      );
    }

    if (req.user) {
      await query(
        'INSERT INTO activity_logs (admin_id, admin_name, action, details) VALUES (?, ?, ?, ?)',
        [req.user.id, req.user.name, 'UPDATE_SETTINGS', 'Updated trust configuration settings']
      );
    }

    res.json({ success: true, message: 'Settings saved successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getActivityLogs = async (req, res) => {
  try {
    const logs = await query('SELECT * FROM activity_logs ORDER BY created_at DESC LIMIT 50');
    res.json({ success: true, logs });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
