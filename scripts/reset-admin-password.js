// scripts/reset-admin-password.js
// Resets the admin@postup.com password to "admin123" using bcrypt
const bcrypt = require('bcryptjs');
const { MongoClient } = require('mongodb');
const fs = require('fs');
const path = require('path');

// Load .env.local manually
const envPath = path.join(__dirname, '..', '.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const eqIndex = trimmed.indexOf('=');
      if (eqIndex > 0) {
        const key = trimmed.substring(0, eqIndex).trim();
        const value = trimmed.substring(eqIndex + 1).trim();
        if (!process.env[key]) {
          process.env[key] = value;
        }
      }
    }
  });
}

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/post-up';
console.log('Using MongoDB URI:', MONGODB_URI.substring(0, 30) + '...');

async function resetPassword() {
  console.log('Connecting to MongoDB...');
  const client = new MongoClient(MONGODB_URI);

  try {
    await client.connect();
    const db = client.db(); // uses default DB from URI

    const email = 'admin@postup.com';
    const newPassword = 'admin123';

    // Hash the password with bcrypt
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    console.log(`New bcrypt hash for "${newPassword}": ${hashedPassword}`);

    // Verify the hash works
    const verifyResult = await bcrypt.compare(newPassword, hashedPassword);
    console.log(`Verification of new hash: ${verifyResult}`);

    // Update the user's password
    const result = await db.collection('users').updateOne(
      { email },
      { $set: { password: hashedPassword } }
    );

    if (result.matchedCount === 0) {
      console.log(`❌ No user found with email: ${email}`);
    } else {
      console.log(`✅ Password reset successfully for ${email}`);
      console.log(`   Matched: ${result.matchedCount}, Modified: ${result.modifiedCount}`);
    }

    // Double-check: read back and verify
    const user = await db.collection('users').findOne({ email });
    if (user) {
      const finalCheck = await bcrypt.compare(newPassword, user.password);
      console.log(`\n🔍 Final verification - bcrypt.compare("${newPassword}", storedHash): ${finalCheck}`);
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.close();
    console.log('MongoDB connection closed.');
  }
}

resetPassword();
