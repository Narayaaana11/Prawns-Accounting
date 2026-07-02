const mongoose = require('mongoose');
const User = require('./src/models/User');
const Company = require('./src/models/Company');
require('dotenv').config();

async function createSpecificUser() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB connected');

    const company = await Company.findOne();
    if (!company) {
      console.log('No company found in database. Cannot create user.');
      process.exit(1);
    }

    const phone = '7207374686';
    const password = '7207374686';
    
    // Check if user already exists
    let user = await User.findOne({ phone });
    if (user) {
      console.log('User with this phone number already exists.');
      user.password = password; // Reset password to ensure it matches
      await user.save();
      console.log('Password reset for existing user.');
    } else {
      user = await User.create({
        name: 'User 7207374686',
        email: '7207374686@aquafarm.co',
        password: password,
        phone: phone,
        role: 'Sales Staff',
        company: company._id,
        isActive: true
      });
      console.log('User created successfully:', user.email, user.phone);
    }
    
    process.exit(0);
  } catch (err) {
    console.error('Failed to create user:', err);
    process.exit(1);
  }
}

createSpecificUser();
