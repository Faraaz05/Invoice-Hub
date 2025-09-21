const bcrypt = require('bcryptjs');
const User = require('../models/User');

const createAdminUser = async () => {
  try {
    // Check if admin already exists
    const existingAdmin = await User.findOne({ role: 'admin' });
    
    if (existingAdmin) {
      console.log('Admin user already exists');
      return;
    }

    // Create default admin user
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@invoicehub.com';
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
    
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(adminPassword, saltRounds);

    const adminUser = await User.create({
      name: 'System Administrator',
      email: adminEmail,
      passwordHash,
      role: 'admin'
    });

    console.log(`Admin user created successfully:`);
    console.log(`Email: ${adminUser.email}`);
    console.log(`Password: ${adminPassword}`);
    console.log('Please change the admin password after first login.');

  } catch (error) {
    console.error('Error creating admin user:', error.message);
  }
};

module.exports = { createAdminUser };