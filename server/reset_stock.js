const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

async function run() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    
    const Product = require('./src/models/Product');
    const result = await Product.updateMany(
      { category: 'Vannamei Prawns' },
      { $set: { stock: 0 } }
    );
    
    console.log(`Success! Reset stock to 0 for ${result.modifiedCount} products.`);
  } catch (err) {
    console.error('Error:', err);
  } finally {
    process.exit(0);
  }
}
run();
