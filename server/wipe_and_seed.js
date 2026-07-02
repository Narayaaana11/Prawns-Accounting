const mongoose = require('mongoose');
require('dotenv').config();

const User = require('./src/models/User');
const Company = require('./src/models/Company');

const run = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to DB');

    // Drop database completely
    await mongoose.connection.db.dropDatabase();
    console.log('Dropped all collections and data.');

    // Seed Company
    const company = await Company.create({
      name: 'AquaFlow ERP',
      ownerName: 'Admin',
      phone: '7207374686',
      email: '7207374686@aqua.com',
      address: '123 Ocean Drive, Vizag'
    });

    // Seed User
    const user = await User.create({
      name: 'Admin',
      email: '7207374686@aqua.com',
      phone: '7207374686',
      password: '7207374686',
      role: 'Owner',
      company: company._id
    });

    console.log(`Created user with phone: ${user.phone}`);
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

run();
