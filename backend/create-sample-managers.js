const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/invoicehub');
    console.log('✅ MongoDB connected');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    process.exit(1);
  }
};

const createSampleManagers = async () => {
  try {
    await connectDB();

    // Sample managers for different departments
    const sampleManagers = [
      {
        name: 'Sarah Johnson',
        email: 'sarah.sales@invoicehub.com',
        password: 'manager123',
        role: 'manager',
        department: 'Sales'
      },
      {
        name: 'Mark Wilson',
        email: 'mark.marketing@invoicehub.com',
        password: 'manager123',
        role: 'manager',
        department: 'Marketing'
      },
      {
        name: 'Lisa Chen',
        email: 'lisa.finance@invoicehub.com',
        password: 'manager123',
        role: 'manager',
        department: 'Finance'
      },
      {
        name: 'David Brown',
        email: 'david.operations@invoicehub.com',
        password: 'manager123',
        role: 'manager',
        department: 'Operations'
      },
      {
        name: 'Emma Davis',
        email: 'emma.hr@invoicehub.com',
        password: 'manager123',
        role: 'manager',
        department: 'HR'
      }
    ];

    console.log('🔧 Creating sample managers...');

    for (const managerData of sampleManagers) {
      // Check if manager already exists
      const existingManager = await User.findOne({ email: managerData.email });
      
      if (!existingManager) {
        // Hash password
        const saltRounds = 12;
        const passwordHash = await bcrypt.hash(managerData.password, saltRounds);

        // Create manager
        const manager = await User.create({
          name: managerData.name,
          email: managerData.email,
          passwordHash: passwordHash,
          role: managerData.role,
          department: managerData.department
        });

        console.log(`✅ Created manager: ${manager.name} (${manager.department} Department)`);
      } else {
        console.log(`⚠️  Manager already exists: ${managerData.name} (${managerData.department})`);
      }
    }

    // Create a sample clerk user
    const clerkData = {
      name: 'John Clerk',
      email: 'john.clerk@invoicehub.com',
      password: 'clerk123',
      role: 'clerk'
    };

    const existingClerk = await User.findOne({ email: clerkData.email });
    if (!existingClerk) {
      const saltRounds = 12;
      const passwordHash = await bcrypt.hash(clerkData.password, saltRounds);

      const clerk = await User.create({
        name: clerkData.name,
        email: clerkData.email,
        passwordHash: passwordHash,
        role: clerkData.role
      });

      console.log(`✅ Created clerk: ${clerk.name}`);
    } else {
      console.log(`⚠️  Clerk already exists: ${clerkData.name}`);
    }

    console.log('\n🎉 Sample users created successfully!');
    console.log('\n📝 Login Credentials:');
    console.log('   Admin: admin@invoicehub.com / admin123');
    console.log('   Clerk: john.clerk@invoicehub.com / clerk123');
    console.log('   Sales Manager: sarah.sales@invoicehub.com / manager123');
    console.log('   Marketing Manager: mark.marketing@invoicehub.com / manager123');
    console.log('   Finance Manager: lisa.finance@invoicehub.com / manager123');
    console.log('   Operations Manager: david.operations@invoicehub.com / manager123');
    console.log('   HR Manager: emma.hr@invoicehub.com / manager123');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating sample managers:', error);
    process.exit(1);
  }
};

createSampleManagers();