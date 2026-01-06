#!/usr/bin/env node

/**
 * RESTORE PROJECT IF DELETED
 * Checks if a project was soft deleted and restores it
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

async function restoreProjectIfDeleted() {
  try {
    log('🔍 CHECKING PROJECT STATUS', 'cyan');
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
      // Soft delete fields
      isDeleted: { type: Boolean, default: false },
      deletedAt: { type: Date },
      deletedBy: { type: String },
      restoreAvailableUntil: { type: Date },
    }, { timestamps: true }));

    const projectId = "693aaf4dc27e95a9fd1a0f05";
    
    // Find the project
    const project = await Project.findById(projectId).exec();
    
    if (!project) {
      log('❌ Project not found in database', 'red');
      process.exit(1);
    }

    log(`✅ Found project: ${project.title}`, 'green');
    log(`   Status: ${project.isDeleted ? 'Deleted' : 'Active'}`, project.isDeleted ? 'yellow' : 'green');

    if (project.isDeleted) {
      log(`   Deleted at: ${project.deletedAt}`, 'yellow');
      log(`   Restore available until: ${project.restoreAvailableUntil}`, 'yellow');
      
      // Restore the project
      const restoredProject = await Project.findByIdAndUpdate(
        projectId,
        {
          isDeleted: false,
          deletedAt: undefined,
          deletedBy: undefined,
          restoreAvailableUntil: undefined
        },
        { new: true }
      ).exec();

      log(`✅ Project restored successfully!`, 'green');
      log(`   Title: ${restoredProject.title}`, 'green');
    } else {
      log(`✅ Project is already active`, 'green');
    }

    log('\n🎉 Project status check completed!', 'green');
    
    process.exit(0);
  } catch (error) {
    log(`❌ Error: ${error.message}`, 'red');
    console.error(error);
    process.exit(1);
  }
}

// Run the restoration
restoreProjectIfDeleted();
