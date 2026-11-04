const express = require('express');
const router = express.Router();
const donationsController = require('../controllers/donations.controller');
const { authMiddleware } = require('../middleware/auth');

// Public route to record online donation from website (if needed)
router.post('/public/submit', donationsController.create);
router.get('/public/:id/receipt.pdf', donationsController.getPublicReceipt);
router.get('/public/:id/receipt', donationsController.getPublicReceipt);
router.get('/public/:id/pdf', donationsController.downloadReceiptPdf);
router.get('/:id/receipt.pdf', donationsController.getPublicReceipt);
router.get('/:id/receipt', donationsController.getPublicReceipt);
router.get('/:id/pdf', donationsController.downloadReceiptPdf);

// Protected routes for Admin panel
router.get('/', authMiddleware, donationsController.getAll);
router.get('/:id', authMiddleware, donationsController.getById);
router.post('/', authMiddleware, donationsController.create);
router.put('/:id', authMiddleware, donationsController.update);
router.delete('/:id', authMiddleware, donationsController.delete);
router.post('/:id/send-receipt', authMiddleware, donationsController.sendReceiptEmail);

module.exports = router;
