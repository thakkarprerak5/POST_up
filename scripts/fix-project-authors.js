/**
 * Database Fix Script: Repair Corrupt Project Author References
 * 
 * This script finds projects where the author field is an embedded object
 * instead of an ObjectId reference, and fixes them by replacing with proper references.
 * 
 * Run with: node scripts/fix-project-authors.js
 */

const mongoose = require('mongoose');
const readline = require('readline');

// MongoDB connection string - UPDATE THIS
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/your-database-name';

// Simple schemas
const UserSchema = new mongoose.Schema({}, { strict: false, collection: 'users' });
const ProjectSchema = new mongoose.Schema({}, { strict: false, collection: 'projects' });

const User = mongoose.model('User', UserSchema);
const Project = mongoose.model('Project', ProjectSchema);

async function fixProjectAuthors() {
    try {
        console.log('🔌 Connecting to MongoDB...');
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Connected to MongoDB\n');

        // Find all projects
        const projects = await Project.find({}).exec();
        console.log(`📊 Found ${projects.length} total projects\n`);

        let fixedCount = 0;
        let alreadyCorrectCount = 0;
        let cantFixCount = 0;

        for (const project of projects) {
            const author = project.author;

            // Check if author is already an ObjectId (correct format)
            if (author instanceof mongoose.Types.ObjectId) {
                alreadyCorrectCount++;
                continue;
            }

            // Author is an object - need to fix
            console.log(`\n🔧 Fixing project: ${project.title || project._id}`);
            console.log(`   Current author:`, author);

            let userId = null;

            // Try to find user by _id if it exists in the object
            if (author._id) {
                userId = author._id;
                console.log(`   Found _id in object:`, userId);
            }
            // Try to find by email
            else if (author.email) {
                console.log(`   Searching by email:`, author.email);
                const user = await User.findOne({ email: author.email }).exec();
                if (user) {
                    userId = user._id;
                    console.log(`   ✅ Found user by email:`, userId);
                }
            }
            // Try to find by name
            else if (author.name || author.fullName) {
                const nameToMatch = author.name || author.fullName;
                console.log(`   Searching by name:`, nameToMatch);
                const user = await User.findOne({ fullName: nameToMatch }).exec();
                if (user) {
                    userId = user._id;
                    console.log(`   ✅ Found user by name:`, userId);
                }
            }

            if (userId) {
                // Update the project with the correct ObjectId reference
                await Project.findByIdAndUpdate(project._id, {
                    $set: { author: userId }
                }).exec();
                console.log(`   ✅ Fixed! Updated author to ObjectId reference`);
                fixedCount++;
            } else {
                console.log(`   ❌ Could not find matching user for this project`);
                cantFixCount++;
            }
        }

        console.log(`\n\n📊 Summary:`);
        console.log(`   ✅ Already correct: ${alreadyCorrectCount}`);
        console.log(`   🔧 Fixed: ${fixedCount}`);
        console.log(`   ❌ Couldn't fix: ${cantFixCount}`);
        console.log(`   📁 Total: ${projects.length}`);

    } catch (error) {
        console.error('\n❌ Error:', error);
    } finally {
        await mongoose.connection.close();
        console.log('\n🔌 Disconnected from MongoDB');
    }
}

// Confirmation prompt
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

console.log('⚠️  This script will modify your database!');
console.log('⚠️  Make sure you have a backup before proceeding.\n');

rl.question('Are you sure you want to continue? (yes/no): ', (answer) => {
    if (answer.toLowerCase() === 'yes') {
        fixProjectAuthors().then(() => {
            rl.close();
            process.exit(0);
        });
    } else {
        console.log('❌ Aborted');
        rl.close();
        process.exit(0);
    }
});
