const express = require('express');
const router = express.Router();
const { getFinancialAnalytics } = require('../controllers/financialAnalyticsController');
const { protect, controllerOrHigher } = require('../middleware/authMiddleware');

// GET /api/financial-analytics - Get comprehensive financial analytics
// Protect route and ensure controller or admin access
router.get('/', protect, controllerOrHigher, getFinancialAnalytics);

module.exports = router;