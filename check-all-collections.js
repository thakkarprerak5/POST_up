// Script to check all collections and find users
const mongoose = require('mongoose');

const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/post_up';

async function checkAllCollections() {
  try {
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');
    
    const db = mongoose.connection.db;
    
    // List all collections
    const collections = await db.listCollections().toArray();
    console.log('Collections in database:');
    collections.forEach(col => console.log(`- ${col.name}`));
    
    // Check each collection for user-like data
    for (const collection of collections) {
      const count = await db.collection(collection.name).countDocuments();
      console.log(`\n${collection.name}: ${count} documents`);
      
      if (count > 0 && count < 10) {
        const docs = await db.collection(collection.name).find({}).limit(3).toArray();
        docs.forEach((doc, index) => {
          console.log(`  Document ${index + 1}:`, Object.keys(doc));
        });
      }
    }
    
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkAllCollections();
