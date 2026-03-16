// Migration script to add authorId field to existing projects
// This ensures all projects have a permanent reference to the user

const mongoose = require('mongoose');

// Since we're dealing with TypeScript files, we need to require them differently
// For now, let's use direct MongoDB operations
async function migrateAuthorId() {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/post-up');
    console.log('Connected to MongoDB');

    // Get the projects collection directly
    const db = mongoose.connection.db;
    const projectsCollection = db.collection('projects');
    const usersCollection = db.collection('users');

    // Find all projects that don't have authorId field
    const projectsWithoutAuthorId = await projectsCollection.find({ authorId: { $exists: false } }).toArray();
    console.log(`Found ${projectsWithoutAuthorId.length} projects without authorId`);

    let updatedCount = 0;
    let errorCount = 0;

    for (const project of projectsWithoutAuthorId) {
      try {
        // Try to find user by the stored author name
        const user = await usersCollection.findOne({ fullName: project.author.name });
        
        if (user) {
          // Update project with authorId
          await projectsCollection.updateOne(
            { _id: project._id },
            { $set: { authorId: user._id.toString() } }
          );
          console.log(`✅ Updated project "${project.title}" with authorId: ${user._id}`);
          updatedCount++;
        } else {
          console.log(`⚠️  Could not find user for project "${project.title}" with author name: "${project.author.name}"`);
          errorCount++;
        }
      } catch (error) {
        console.error(`❌ Error updating project ${project._id}:`, error);
        errorCount++;
      }
    }

    console.log(`\nMigration complete:`);
    console.log(`✅ Successfully updated: ${updatedCount} projects`);
    console.log(`❌ Failed to update: ${errorCount} projects`);
    console.log(`📊 Total processed: ${projectsWithoutAuthorId.length} projects`);

  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run the migration
if (require.main === module) {
  migrateAuthorId();
}

module.exports = migrateAuthorId;
