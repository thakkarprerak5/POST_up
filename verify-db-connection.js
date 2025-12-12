#!/usr/bin/env node
/**
 * Database Connection & Data Verification Script
 * Tests MongoDB connection and validates data availability
 */

const mongoose = require("mongoose");
require("dotenv").config({ path: ".env.local" });

const MONGODB_URI = process.env.MONGODB_URI;

console.log("\n📊 DATABASE VERIFICATION SCRIPT\n");
console.log("=" + "=".repeat(50));

if (!MONGODB_URI) {
  console.error("❌ ERROR: MONGODB_URI not found in .env.local");
  console.log("\n📝 To fix:");
  console.log("   1. Create .env.local in project root");
  console.log('   2. Add: MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/POST_up');
  process.exit(1);
}

console.log("✅ MONGODB_URI found");
console.log(`   Connection: ${MONGODB_URI.substring(0, 30)}...`);

// Define minimal schemas for verification
const ProjectSchema = new mongoose.Schema({}, { strict: false });
const UserSchema = new mongoose.Schema({}, { strict: false });

const Project = mongoose.model("Project", ProjectSchema);
const User = mongoose.model("User", UserSchema);

async function verifyDatabase() {
  try {
    console.log("\n🔗 Connecting to MongoDB...");
    await mongoose.connect(MONGODB_URI);
    console.log("✅ Connected to MongoDB successfully!");

    // Check collections
    console.log("\n📦 Checking collections...");
    const collections = await mongoose.connection.db.listCollections().toArray();
    const collectionNames = collections.map((c) => c.name);
    console.log(`   Found ${collectionNames.length} collection(s):`, collectionNames);

    // Count documents
    console.log("\n📊 Document counts:");
    const projectCount = await Project.countDocuments();
    const userCount = await User.countDocuments();

    console.log(`   - Projects: ${projectCount}`);
    console.log(`   - Users: ${userCount}`);

    // Sample data
    if (projectCount > 0) {
      console.log("\n📋 Sample project (first 3 fields):");
      const project = await Project.findOne().lean();
      const entries = Object.entries(project).slice(0, 3);
      entries.forEach(([key, value]) => {
        console.log(`   ${key}: ${JSON.stringify(value).substring(0, 50)}`);
      });
    } else {
      console.log("\n⚠️  No projects found in database");
      console.log("    → This is normal for a new deployment");
      console.log("    → You can create test data via the UI");
    }

    if (userCount > 0) {
      console.log("\n👤 Sample user (first 3 fields):");
      const user = await User.findOne().lean();
      const entries = Object.entries(user).slice(0, 3);
      entries.forEach(([key, value]) => {
        console.log(`   ${key}: ${JSON.stringify(value).substring(0, 50)}`);
      });
    } else {
      console.log("\n⚠️  No users found in database");
      console.log("    → This is normal before any sign-ups");
    }

    console.log("\n✅ Database connection verified!");
    console.log("\n💡 Next steps:");
    console.log("   1. Sign up via /signup page to create a user");
    console.log("   2. Upload projects via /upload page");
    console.log("   3. Try likes, comments, follows");
    console.log("   4. Check /mentors and /feed pages\n");

    await mongoose.disconnect();
  } catch (error) {
    console.error("\n❌ ERROR:", error.message);
    if (error.message.includes("ENOTFOUND")) {
      console.log("\n💡 Connection failed - possible causes:");
      console.log("   - Incorrect MongoDB URI");
      console.log("   - Network access not allowed in MongoDB Atlas");
      console.log("   - MongoDB server is down");
    }
    process.exit(1);
  }
}

verifyDatabase();
