const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const session = require('express-session');
const connectDB = require('./config/db');
const healthRoutes = require('./routes/healthRoutes');
const authRoutes = require('./routes/authRoutes');
const invoiceRoutes = require('./routes/invoiceRoutes');
const { createAdminUser } = require('./utils/adminSeeder');

// Load environment variables
dotenv.config();

// Connect to MongoDB and create admin user
const initializeApp = async () => {
  await connectDB();
  await createAdminUser();
};
initializeApp();

const app = express();

// Middleware
app.use(express.json({ limit: '10mb' }));

// Session middleware for temporary file storage
app.use(session({
  secret: process.env.SESSION_SECRET || 'invoice-hub-session-secret',
  resave: false,
  saveUninitialized: false,
  cookie: { 
    secure: false, // Set to true in production with HTTPS
    maxAge: 30 * 60 * 1000 // 30 minutes
  }
}));

// Configure CORS - more permissive for development
app.use(cors({
  origin: true, // Allow all origins in development
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  credentials: true,
  preflightContinue: false,
  optionsSuccessStatus: 200
}));

// Debug middleware to log requests
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  const origin = req.get('Origin') || 'No Origin';
  const userAgent = req.get('User-Agent') || 'No User-Agent';
  const contentType = req.get('Content-Type') || 'No Content-Type';
  const authorization = req.get('Authorization') ? 'Present' : 'Missing';
  
  console.log(`\n📥 [${timestamp}] ${req.method} ${req.path}`);
  console.log(`   Origin: ${origin}`);
  console.log(`   Content-Type: ${contentType}`);
  console.log(`   Authorization: ${authorization}`);
  console.log(`   User-Agent: ${userAgent.substring(0, 50)}...`);
  
  if (req.method === 'OPTIONS') {
    console.log('   🔄 CORS Preflight Request');
  }
  
  // Log response when request completes
  const originalSend = res.send;
  res.send = function(body) {
    const duration = Date.now() - req.startTime;
    console.log(`📤 Response: ${res.statusCode} (${duration}ms)`);
    return originalSend.call(this, body);
  };
  
  req.startTime = Date.now();
  next();
});

// Serve static files from uploads directory
app.use('/uploads', express.static('uploads'));

// Routes
app.use('/api', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/invoices', invoiceRoutes);

// Default route
app.get('/', (req, res) => {
  res.json({ message: 'InvoiceHub Backend API' });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, '0.0.0.0', () => {
  console.log('\n🚀 === INVOICEHUB BACKEND SERVER STARTED ===');
  console.log(`⏰ Timestamp: ${new Date().toISOString()}`);
  console.log(`🌐 Port: ${PORT}`);
  console.log(`🏠 Host: 0.0.0.0 (all interfaces)`);
  console.log('\n📡 Server Access URLs:');
  console.log(`   Local:    http://localhost:${PORT}`);
  console.log(`   Network:  http://0.0.0.0:${PORT}`);
  console.log(`   IPv4:     http://127.0.0.1:${PORT}`);
  
  console.log('\n🔧 CORS Configuration:');
  console.log('   Origin: true (allow all origins)');
  console.log('   Methods: GET, POST, PUT, DELETE, PATCH, OPTIONS');
  console.log('   Headers: Content-Type, Authorization, X-Requested-With');
  console.log('   Credentials: true');
  
  console.log('\n🛣️  API Endpoints:');
  console.log('   Health Check: GET /api/health');
  console.log('   Authentication: /api/auth/*');
  console.log('   Invoice Upload: POST /api/invoices/upload');
  console.log('   Invoice Routes: /api/invoices/*');
  
  console.log('\n✅ Server ready to accept connections');
  console.log('=====================================\n');
});