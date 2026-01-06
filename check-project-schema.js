#!/usr/bin/env node

/**
 * CHECK PROJECT SCHEMA
 * Checks the actual schema of the project in the database
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

async function checkProjectSchema() {
  try {
    log('🔍 CHECKING PROJECT SCHEMA', 'cyan');
    log('=====================================', 'cyan');

    // Connect to database
    await connectDB();
    log('✅ Connected to database', 'green');

    // Get the projects collection directly
    const db = mongoose.connection.db;
    const projectsCollection = db.collection('projects');
    
    const projectId = "693aaf4dc27e95a9fd1a0f05";
    
    // Find the project
    const project = await projectsCollection.findOne({ _id: new mongoose.Types.ObjectId(projectId) });
    
    if (!project) {
      log('❌ Project not found in database', 'red');
      process.exit(1);
    }

    log(`✅ Found project: ${project.title}`, 'green');
    log(`   Project ID: ${project._id}`, 'green');
    log(`   Author: ${project.author?.name || 'Unknown'}`, 'green');
    
    // Check for soft delete fields
    log(`\n📋 Checking soft delete fields:`, 'blue');
    log(`   isDeleted: ${project.isDeleted || 'Not present'}`, project.isDeleted !== undefined ? 'green' : 'yellow');
    log(`   deletedAt: ${project.deletedAt || 'Not present'}`, project.deletedAt !== undefined ? 'green' : 'yellow');
    log(`   deletedBy: ${project.deletedBy || 'Not present'}`, project.deletedBy !== undefined ? 'green' : 'yellow');
    log(`   restoreAvailableUntil: ${project.restoreAvailableUntil || 'Not present'}`, project.restoreAvailableUntil !== undefined ? 'green' : 'yellow');

    // Add soft delete fields if they don't exist
    if (project.isDeleted === undefined) {
      log(`\n🔧 Adding soft delete fields to project...`, 'yellow');
      
      await projectsCollection.updateOne(
        { _id: new mongoose.Types.ObjectId(projectId) },
        { 
          $set: {
            isDeleted: false,
            deletedAt: null,
            deletedBy: null,
            restoreAvailableUntil: null
          }
        }
      );
      
      log(`✅ Soft delete fields added successfully!`, 'green');
    }

    log('\n🎉 Schema check completed!', 'green');
    
    process.exit(0);
  } catch (error) {
    log(`❌ Error: ${error.message}`, 'red');
    console.error(error);
    process.exit(1);
  }
}

// Run the check
checkProjectSchema();
