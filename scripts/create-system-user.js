/**
 * Create System User for Orphaned Projects
 * 
 * This script creates a special "System" user account that will own
 * any projects that don't have a valid author.
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/your-database-name';

const UserSchema = new mongoose.Schema({}, { strict: false, collection: 'users' });
const User = mongoose.model('User', UserSchema);

async function createSystemUser() {
    try {
        console.log('🔌 Connecting to MongoDB...');
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Connected\n');

        // Check if system user already exists
        const existing = await User.findOne({ email: 'system@internal.app' }).exec();

        if (existing) {
            console.log('✅ System user already exists:');
            console.log('   ID:', existing._id.toString());
            console.log('   Email:', existing.email);
            console.log('   Name:', existing.fullName);
            return existing._id;
        }

        // Create system user
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash('SYSTEM_ACCOUNT_NO_LOGIN', salt);

        const systemUser = new User({
            fullName: '[System Account]',
            email: 'system@internal.app',
            password: hashedPassword,
            type: 'admin',
            profile: {
                type: 'student',
                joinedDate: new Date(),
                bio: 'System account for orphaned projects',
                skills: [],
                projects: []
            },
            followers: [],
            following: [],
            followerCount: 0,
            followingCount: 0,
            isActive: false, // Prevent login
            isBlocked: false
        });

        await systemUser.save();

        console.log('✅ System user created successfully!');
        console.log('   ID:', systemUser._id.toString());
        console.log('   Email:', systemUser.email);
        console.log('\n📝 Copy this ID - you\'ll need it for the fix script:\n');
        console.log(`   ${systemUser._id.toString()}\n`);

        return systemUser._id;

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await mongoose.connection.close();
        console.log('🔌 Disconnected');
    }
}

createSystemUser().then(() => process.exit(0));
