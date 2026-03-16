import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Project from '@/models/Project';
import User from '@/models/User';
import mongoose from 'mongoose';

/**
 * Quick Fix Endpoint: Repair corrupt project author references
 * Visit: http://localhost:3000/api/admin/fix-project-authors
 * 
 * Updated: System user fallback enabled
 */
export async function GET() {
    try {
        await connectDB();

        const results = {
            total: 0,
            alreadyCorrect: 0,
            fixed: 0,
            couldNotFix: 0,
            details: [] as any[]
        };

        // Find all projects
        const projects = await Project.find({}).exec();
        results.total = projects.length;

        console.log(`\n🔧 Fixing ${projects.length} projects...\n`);

        for (const project of projects) {
            const detail: any = {
                projectId: project._id.toString(),
                title: project.title,
                status: ''
            };

            // Check if author is already an ObjectId (correct!)
            if (project.author instanceof mongoose.Types.ObjectId) {
                results.alreadyCorrect++;
                detail.status = 'Already correct (ObjectId reference)';
                detail.authorId = project.author.toString();
            } else if (typeof project.author === 'object' && project.author !== null) {
                // Author is embedded object - need to fix
                console.log(`Fixing: ${project.title}`);
                console.log(`  Current author:`, project.author);

                let userId = null;

                // Try to extract _id if it exists
                if (project.author._id) {
                    userId = project.author._id;
                    detail.method = 'Extracted from _id field';
                }
                // Try email lookup
                else if (project.author.email) {
                    const user = await User.findOne({ email: project.author.email }).exec();
                    if (user) {
                        userId = user._id;
                        detail.method = `Found by email: ${project.author.email}`;
                    }
                }
                // Try name lookup
                else if (project.author.name || project.author.fullName) {
                    const nameToMatch = project.author.name || project.author.fullName;
                    const user = await User.findOne({
                        $or: [{ name: nameToMatch }, { fullName: nameToMatch }]
                    }).exec();
                    if (user) {
                        userId = user._id;
                        detail.method = `Found by name: ${nameToMatch}`;
                    }
                }

                if (userId) {
                    // Update the project
                    await Project.findByIdAndUpdate(project._id, {
                        $set: { author: userId }
                    }).exec();

                    results.fixed++;
                    detail.status = 'FIXED ✅';
                    detail.authorId = userId.toString();
                    console.log(`  ✅ Fixed! Author ID: ${userId.toString()}`);
                } else {
                    // FALLBACK: Assign to System user if no match found
                    console.log(`  ⚠️ No matching user found, looking for System account...`);

                    const systemUser = await User.findOne({ email: 'system@internal.app' }).exec();

                    if (systemUser) {
                        await Project.findByIdAndUpdate(project._id, {
                            $set: { author: systemUser._id }
                        }).exec();

                        results.fixed++;
                        detail.status = 'ASSIGNED TO SYSTEM USER ⚠️';
                        detail.authorId = systemUser._id.toString();
                        detail.note = 'Orphaned project - assigned to system account';
                        console.log(`  ⚠️ Assigned to System user: ${systemUser._id.toString()}`);
                    } else {
                        results.couldNotFix++;
                        detail.status = 'COULD NOT FIX ❌';
                        detail.error = 'No matching user found and no System user exists';
                        detail.solution = 'Run: node scripts/create-system-user.js first';
                        console.log(`  ❌ Could not find matching user AND no System user exists`);
                        console.log(`  💡 Solution: Run 'node scripts/create-system-user.js' first`);
                    }
                }
            } else {
                // Author is some other type (string?)
                detail.status = 'Unknown author type';
                detail.authorType = typeof project.author;
                results.couldNotFix++;
            }

            results.details.push(detail);
        }

        console.log(`\n📊 Summary:`);
        console.log(`   Total: ${results.total}`);
        console.log(`   Already correct: ${results.alreadyCorrect}`);
        console.log(`   Fixed: ${results.fixed}`);
        console.log(`   Could not fix: ${results.couldNotFix}\n`);

        return NextResponse.json({
            success: true,
            message: `Fixed ${results.fixed} projects`,
            results
        });

    } catch (error: any) {
        console.error('Error fixing projects:', error);
        return NextResponse.json({
            success: false,
            error: error.message
        }, { status: 500 });
    }
}
