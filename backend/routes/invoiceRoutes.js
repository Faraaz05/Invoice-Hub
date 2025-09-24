const express = require('express');
const {
  createInvoice,
  getAllInvoices,
  getInvoiceById,
  updateInvoice,
  approveRejectInvoice,
  markAsPaid,
  getDashboardStats,
  uploadInvoice,
  previewInvoice,
  saveConfirmedInvoice,
  getInvoiceFile
} = require('../controllers/invoiceController');
const { protect, managerOrHigher, controllerOrHigher, clerkOrHigher } = require('../middleware/authMiddleware');
const { uploadMiddleware } = require('../middleware/uploadMiddleware');

const router = express.Router();

// Dashboard statistics
router.get('/dashboard/stats', protect, getDashboardStats);
router.get('/stats', protect, getDashboardStats); // Alias for backward compatibility

// File upload route (clerk and above can upload) - auth middleware applied after multer
router.post('/upload', uploadMiddleware, protect, uploadInvoice);

// Preview route (processes file but doesn't save to database)
router.post('/preview', uploadMiddleware, protect, previewInvoice);

// Save confirmed invoice after validation
router.post('/save-confirmed', protect, clerkOrHigher, saveConfirmedInvoice);

// All other routes require authentication
router.use(protect);

// Invoice CRUD operations
router.post('/', createInvoice);
router.get('/', getAllInvoices);
router.get('/:id', getInvoiceById);
router.get('/:id/file', getInvoiceFile);  // Serve original invoice file from database
router.put('/:id', clerkOrHigher, updateInvoice);  // Clerk can edit invoices

// Approval workflow routes
router.post('/:id/approve-reject', managerOrHigher, approveRejectInvoice);
router.post('/:id/mark-paid', controllerOrHigher, markAsPaid);

module.exports = router;