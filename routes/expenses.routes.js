const express = require('express');
const router = express.Router();
const expensesController = require('../controllers/expenses.controller');
const { authMiddleware } = require('../middleware/auth');
const upload = require('../middleware/upload');

// Protected routes (All authenticated admins / trustees / staff)
router.use(authMiddleware);

router.get('/stats', expensesController.getStats);
router.get('/', expensesController.getAll);
router.get('/:id', expensesController.getById);
router.post('/', upload.single('receipt'), expensesController.create);
router.put('/:id', upload.single('receipt'), expensesController.update);
router.delete('/:id', expensesController.delete);

module.exports = router;
