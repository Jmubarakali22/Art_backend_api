const express = require('express');
const router = express.Router();
const studentsController = require('../controllers/students.controller');
const { authMiddleware } = require('../middleware/auth');

// Public routes for Website registration form & Webhooks
router.get('/public', (req, res) => {
  res.json({
    success: true,
    message: 'Ar Rahman Trust Tailoring Students Public Submission API is online. Submit via POST.'
  });
});
router.post('/public', studentsController.createPublic);

// Protected routes for Admin panel
router.get('/', authMiddleware, studentsController.getAll);
router.get('/stats', authMiddleware, studentsController.getStats);
router.get('/config/sheet-url', authMiddleware, studentsController.getSheetUrl);
router.post('/config/sheet-url', authMiddleware, studentsController.saveSheetUrl);
router.get('/:id', authMiddleware, studentsController.getById);
router.post('/', authMiddleware, studentsController.create);
router.patch('/:id/status', authMiddleware, studentsController.updateStatus);
router.patch('/:id/assign-batch', authMiddleware, studentsController.assignBatch);
router.put('/:id', authMiddleware, studentsController.update);
router.delete('/:id', authMiddleware, studentsController.delete);

module.exports = router;
