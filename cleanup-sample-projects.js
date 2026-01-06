#!/usr/bin/env node

/**
 * CLEANUP SAMPLE PROJECTS
 * Removes sample projects that were incorrectly assigned to the user
 */

const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

// Read .env.local file manually
function loadEnv() {
  const envPath = path.join(__dirname, '.env.local');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    envContent.split('\n').forEach(line => {
      const [key, ...values] = line.split('=');
      if (key && values.length > 0) {
        process.env[key.trim()] = values.join('=').trim();
      }
    });
  }
}

loadEnv();

// Connect to database
async function connectDB() {
  if (!process.env.MONGODB_URI) {
    throw new Error("❌ MONGODB_URI is missing in .env.local");
  }
  
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    throw error;
  }
}

// Color codes for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function cleanupSampleProjects() {
  try {
    log('🧹 CLEANING UP SAMPLE PROJECTS', 'cyan');
    log('=====================================', 'cyan');

    // Connect to database
    await connectDB();
    log('✅ Connected to database', 'green');

    // Get the Project model
    const Project = mongoose.model('Project', new mongoose.Schema({
      title: { type: String, required: true },
      description: { type: String, required: true },
      tags: { type: [String], default: [] },
      images: { type: [String], default: [] },
      githubUrl: { type: String },
      liveUrl: { type: String },
      author: {
        id: { type: String, required: true },
        name: { type: String, required: true },
        image: { type: String },
      },
      likes: { type: [String], default: [] },
      likeCount: { type: Number, default: 0 },
      comments: [{
        id: { type: String, required: true },
        userId: { type: String, required: true },
        userName: { type: String, required: true },
        userAvatar: { type: String },
        text: { type: String, required: true },
        createdAt: { type: Date, default: Date.now },
      }],
      shares: { type: [String], default: [] },
      shareCount: { type: Number, default: 0 },
    }, { timestamps: true }));

    const userId = "69327a20497d40e9eb1cd438";
    
    // Find sample projects that don't belong to the user
    const sampleProjects = await Project.find({
      'author.id': userId,
      'author.name': { $in: ['Sarah Johnson', 'Alex Chen', 'Maya Patel'] }
    });

    if (sampleProjects.length === 0) {
      log('✅ No sample projects found to clean up', 'green');
      process.exit(0);
    }

    log(`⚠️  Found ${sampleProjects.length} sample projects to remove:`, 'yellow');
    sampleProjects.forEach(p => log(`   - ${p.title} (by: ${p.author.name})`, 'yellow'));

    // Delete the sample projects
    const deletedProjects = await Project.deleteMany({
      'author.id': userId,
      'author.name': { $in: ['Sarah Johnson', 'Alex Chen', 'Maya Patel'] }
    });

    log(`✅ Successfully removed ${deletedProjects.deletedCount} sample projects`, 'green');

    // Verify what remains
    const remainingProjects = await Project.find({ 'author.id': userId });
    log(`\n📊 Your remaining projects (${remainingProjects.length}):`, 'blue');
    remainingProjects.forEach(p => {
      log(`   - ${p.title} (by: ${p.author.name})`, 'blue');
    });

    log('\n🎉 Cleanup completed successfully!', 'green');
    log('💡 Your profile will now show only your actual uploaded projects', 'blue');
    
    process.exit(0);
  } catch (error) {
    log(`❌ Error: ${error.message}`, 'red');
    console.error(error);
    process.exit(1);
  }
}

// Run the cleanup
cleanupSampleProjects();
