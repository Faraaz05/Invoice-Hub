const bcrypt = require('bcryptjs');
const User = require('./models/User');
const connectDB = require('./config/db');
require('dotenv').config();

const createDemoUsers = async () => {
  try {
    await connectDB();
    
    const demoUsers = [
      {
        name: 'John Clerk',
        email: 'clerk@invoicehub.com',
        password: 'clerk123',
        role: 'clerk'
      },
      {
        name: 'Jane Manager',
        email: 'manager@invoicehub.com',
        password: 'manager123',
        role: 'manager'
      },
      {
        name: 'Bob Controller',
        email: 'controller@invoicehub.com',
        password: 'controller123',
        role: 'controller'
      }
    ];

    for (const userData of demoUsers) {
      // Check if user already exists
      const existingUser = await User.findOne({ email: userData.email });
      
      if (existingUser) {
        console.log(`User ${userData.email} already exists`);
        continue;
      }

      // Hash password
      const saltRounds = 12;
      const passwordHash = await bcrypt.hash(userData.password, saltRounds);

      // Create user
      const user = await User.create({
        name: userData.name,
        email: userData.email,
        passwordHash,
        role: userData.role
      });

      console.log(`Created demo user: ${user.email} (${user.role})`);
    }

    console.log('Demo users created successfully!');
    process.exit(0);
    
  } catch (error) {
    console.error('Error creating demo users:', error.message);
    process.exit(1);
  }
};

createDemoUsers();