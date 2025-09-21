const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db');
const healthRoutes = require('./routes/healthRoutes');
const authRoutes = require('./routes/authRoutes');
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
app.use(cors());

// Routes
app.use('/api', healthRoutes);
app.use('/api/auth', authRoutes);

// Default route
app.get('/', (req, res) => {
  res.json({ message: 'InvoiceHub Backend API' });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});