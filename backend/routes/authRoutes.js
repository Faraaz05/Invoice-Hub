const express = require('express');
const { registerUser, loginUser, getProfile, getManagersByDepartment } = require('../controllers/authController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

const router = express.Router();

// Public routes
router.post('/login', loginUser);

// Protected routes (admin only for user creation)
router.post('/register', protect, adminOnly, registerUser);

// User profile route
router.get('/profile', protect, getProfile);

// Get managers by department (for invoice assignment)
router.get('/managers', protect, getManagersByDepartment);

module.exports = router;