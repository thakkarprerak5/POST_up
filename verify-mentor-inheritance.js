import mongoose from 'mongoose';
import User from './models/User';
import { connectDB } from './lib/db';

async function verifyQueries() {
    try {
        await connectDB();
        console.log('✅ Connected to database');

        const mentorQuery = { type: { $in: ['mentor', 'admin', 'super-admin'] } };
        const mentors = await User.find(mentorQuery).select('fullName email type').lean();

        console.log(`📊 Found ${mentors.length} total mentors (including admins)`);
        mentors.forEach(m => {
            console.log(`- ${m.fullName} (${m.type})`);
        });

        const rolesFound = new Set(mentors.map(m => m.type));
        console.log('🧬 Roles found in mentor list:', Array.from(rolesFound));

        if (rolesFound.has('admin') || rolesFound.has('super-admin')) {
            console.log('✅ PASS: Admins/Super-Admins found in mentor query');
        } else {
            console.log('⚠️ WARNING: No Admins/Super-Admins found in mentor query. (Check if any exist in DB)');
        }

        process.exit(0);
    } catch (error) {
        console.error('❌ Verification failed:', error);
        process.exit(1);
    }
}

// Mocking lib/db if needed or assuming it works with environment variables
// Since I cannot easily run this directly without a full environment,
// I will rely on manual verification instructions if I can't run it.
// But I'll provide the logic here.
