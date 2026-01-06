#!/usr/bin/env node

/**
 * RESTORE SAMPLE PROJECTS
 * Adds the previous sample projects to the database
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

// Sample projects from the home page component
const sampleProjects = [
  {
    title: "E-Commerce Dashboard",
    description: "A modern e-commerce dashboard with real-time analytics, inventory management, and order tracking. Built with React and Node.js for optimal performance.",
    tags: ["React", "Node.js", "MongoDB"],
    images: [
      "/generic-data-dashboard.png",
      "/analytics-chart.png",
      "/generic-mobile-app.png",
    ],
    githubUrl: "https://github.com",
    liveUrl: "https://example.com",
    author: {
      id: "69327a20497d40e9eb1cd438", // Using the existing user ID
      name: "Sarah Johnson",
      image: "/professional-woman-avatar.png",
    },
    likes: [],
    likeCount: 0,
    comments: [],
    shares: [],
    shareCount: 0,
    createdAt: new Date('2025-12-01T10:00:00.000Z'),
  },
  {
    title: "AI Content Generator",
    description: "An AI-powered content generation tool that helps create blog posts, social media content, and marketing copy using advanced language models.",
    tags: ["Python", "OpenAI", "FastAPI"],
    images: [
      "/futuristic-ai-interface.png",
      "/text-editor.png",
      "/content-preview.png",
    ],
    githubUrl: "https://github.com",
    liveUrl: "https://example.com",
    author: {
      id: "69327a20497d40e9eb1cd438", // Using the existing user ID
      name: "Alex Chen",
      image: "/professional-man-avatar.png",
    },
    likes: [],
    likeCount: 0,
    comments: [],
    shares: [],
    shareCount: 0,
    createdAt: new Date('2025-12-02T10:00:00.000Z'),
  },
  {
    title: "Task Management App",
    description: "A collaborative task management application with real-time updates, team workspaces, and productivity insights. Features drag-and-drop functionality.",
    tags: ["Next.js", "Prisma", "PostgreSQL"],
    images: ["/kanban-board.png", "/task-list.jpg", "/team-dashboard.png"],
    githubUrl: "https://github.com",
    liveUrl: "https://example.com",
    author: {
      id: "69327a20497d40e9eb1cd438", // Using the existing user ID
      name: "Maya Patel",
      image: "/professional-woman-developer-avatar.png",
    },
    likes: [],
    likeCount: 0,
    comments: [],
    shares: [],
    shareCount: 0,
    createdAt: new Date('2025-12-03T10:00:00.000Z'),
  },
];

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

async function restoreSampleProjects() {
  try {
    log('🔄 RESTORING SAMPLE PROJECTS', 'cyan');
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
    
    // Check if sample projects already exist
    const existingProjects = await Project.find({
      title: { $in: sampleProjects.map(p => p.title) }
    });

    if (existingProjects.length > 0) {
      log(`⚠️  Found ${existingProjects.length} sample projects already exist:`, 'yellow');
      existingProjects.forEach(p => log(`   - ${p.title}`, 'yellow'));
      
      // Ask if user wants to continue
      log('\n❓ Do you want to continue and potentially create duplicates? (y/n)', 'yellow');
      process.stdin.resume();
      process.stdin.setEncoding('utf8');
      
      process.stdin.on('data', async (key) => {
        if (key.toString().trim().toLowerCase() !== 'y') {
          log('❌ Operation cancelled', 'red');
          process.exit(0);
        }
        
        await proceedWithRestoration(Project);
      });
    } else {
      await proceedWithRestoration(Project);
    }
  } catch (error) {
    log(`❌ Error: ${error.message}`, 'red');
    console.error(error);
    process.exit(1);
  }
}

async function proceedWithRestoration(Project) {
  try {
    // Insert sample projects
    const insertedProjects = await Project.insertMany(sampleProjects);
    
    log(`✅ Successfully added ${insertedProjects.length} sample projects:`, 'green');
    insertedProjects.forEach(p => {
      log(`   - ${p.title} (ID: ${p._id})`, 'green');
    });

    log('\n📊 SUMMARY', 'cyan');
    log('=====================================', 'cyan');
    log(`✅ Sample projects restored: ${insertedProjects.length}`, 'green');
    log('✅ Projects will now appear in the home page and user profiles', 'green');
    
    log('\n🎉 Sample projects have been restored successfully!', 'green');
    log('💡 You can now see them in:', 'blue');
    log('   - Home page feed', 'blue');
    log('   - User profile (projects section)', 'blue');
    log('   - Project detail pages', 'blue');
    
    process.exit(0);
  } catch (error) {
    log(`❌ Error inserting projects: ${error.message}`, 'red');
    console.error(error);
    process.exit(1);
  }
}

// Run the restoration
restoreSampleProjects();
