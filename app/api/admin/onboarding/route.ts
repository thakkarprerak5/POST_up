import { NextResponse, NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { connectDB } from '@/lib/db';
import User from '@/models/User';
import crypto from 'crypto';
import { sendWelcomeEmail } from '@/lib/mail';

/**
 * SUPER ADMIN ONBOARDING API
 * Uses embedded profile subdocument (matches User.ts schema exactly)
 */

async function checkSuperAdmin(req: NextRequest) {
    const token = await getToken({ req: req as any });
    if (!token) return false;
    const user = token as any;
    return user.type === 'super-admin' || user.role === 'super-admin';
}

function generateTempPassword(length: number = 8): string {
    const charset = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%';
    let password = '';
    const randomBytes = crypto.randomBytes(length);
    for (let i = 0; i < length; i++) {
        password += charset[randomBytes[i] % charset.length];
    }
    return password;
}

export async function POST(req: NextRequest) {
    try {
        await connectDB();

        // SECURITY: Verify super-admin access
        if (!await checkSuperAdmin(req)) {
            return NextResponse.json({ error: 'Unauthorized. Super-admin access required.' }, { status: 403 });
        }

        const body = await req.json();
        const { action, users } = body;

        // Validation
        if (!action || !users || !Array.isArray(users)) {
            return NextResponse.json({ error: 'Invalid request: action and users (array) are required.' }, { status: 400 });
        }

        // ============================================================
        // ACTION 1: CREATE USERS (SINGLE-STEP WITH EMBEDDED PROFILE)
        // ============================================================
        if (action === 'create-users') {
            try {
                console.log(`🚀 Starting Bulk Creation for ${users.length} users...`);
                const createdResults = [];
                const failedUsers = [];
                let successCount = 0;

                const currentStudentCount = await User.countDocuments({ type: 'student' });
                let studentEnrollmentCounter = currentStudentCount;

                for (const csvRow of users) {
                    try {
                        const tempPassword = generateTempPassword(8);
                        const userType: 'student' | 'mentor' = csvRow.type === 'mentor' ? 'mentor' : 'student';

                        // Build the embedded profile object to match profileSchema exactly
                        let embeddedProfile: any;

                        if (userType === 'student') {
                            studentEnrollmentCounter++;
                            const enrollmentNo = csvRow.enrollmentNo?.trim() || `ENR${100 + studentEnrollmentCounter}`;

                            embeddedProfile = {
                                type: 'student',
                                enrollmentNo,
                                course: csvRow.course?.trim() || '',
                                branch: csvRow.branch?.trim() || '',
                                bio: csvRow.bio?.trim() || 'Student at PostUp',
                                skills: [],
                                joinedDate: new Date(),
                                socialLinks: { github: '', linkedin: '', portfolio: '' }
                            };
                        } else {
                            embeddedProfile = {
                                type: 'mentor',
                                bio: csvRow.bio?.trim() || 'Mentor at PostUp',
                                department: csvRow.department?.trim() || '',
                                position: csvRow.position?.trim() || '',
                                expertise: [],
                                skills: [],
                                experience: 0,
                                joinedDate: new Date(),
                                socialLinks: { github: '', linkedin: '', portfolio: '' }
                            };
                        }

                        // SINGLE-STEP: Create User with embedded profile.
                        // The pre-save hook in User.ts will hash tempPassword automatically.
                        const newUser = new User({
                            fullName: csvRow.fullName?.trim(),
                            email: csvRow.email.toLowerCase().trim(),
                            password: tempPassword, // plain text — pre-save hook hashes it
                            type: userType,
                            photo: `https://ui-avatars.com/api/?name=${encodeURIComponent(csvRow.fullName?.trim() || 'User')}&background=random&color=fff&size=200`,
                            isActive: true,
                            account_status: 'ACTIVE',
                            profile: embeddedProfile
                        });

                        await newUser.save();

                        const enrollmentNo = userType === 'student'
                            ? (csvRow.enrollmentNo?.trim() || `ENR${100 + studentEnrollmentCounter}`)
                            : '';

                        createdResults.push({
                            fullName: csvRow.fullName,
                            email: csvRow.email,
                            password: tempPassword, // plain text for email sending
                            type: userType,
                            enrollmentNo
                        });

                        successCount++;
                    } catch (error: any) {
                        console.error(`❌ Onboarding failed for ${csvRow.email}:`, error.message);
                        failedUsers.push({ email: csvRow.email, reason: error.message });
                    }
                }

                return NextResponse.json({
                    success: successCount > 0,
                    message: `Successfully onboarded ${successCount} user(s).`,
                    users: createdResults,
                    failedUsers: failedUsers.length > 0 ? failedUsers : undefined,
                    total: users.length,
                    successCount,
                    failedCount: failedUsers.length
                });
            } catch (err: any) {
                return NextResponse.json({ error: err.message }, { status: 500 });
            }
        }

        // ============================================================
        // ACTION 2: SEND EMAILS
        // ============================================================
        else if (action === 'send-emails') {
            try {
                console.log(`📧 Sending welcome emails to ${users.length} users...`);
                const results = { success: 0, failed: 0, errors: [] as any[] };

                for (const user of users) {
                    try {
                        if (!user.email || !user.password) {
                            throw new Error(`Missing email or password for ${user.email || 'unknown user'}`);
                        }
                        await sendWelcomeEmail({
                            email: user.email,
                            password: user.password,
                            enrollmentNo: user.enrollmentNo || '',
                            fullName: user.fullName || 'User',
                        });
                        results.success++;
                    } catch (error: any) {
                        results.failed++;
                        results.errors.push({ email: user.email, error: error.message });
                    }
                }

                return NextResponse.json({
                    success: true,
                    message: `Sent ${results.success} email(s). ${results.failed} failed.`,
                    results,
                });
            } catch (err: any) {
                return NextResponse.json({ error: err.message }, { status: 500 });
            }
        }

        // ============================================================
        // FALLBACK: UNKNOWN ACTION
        // ============================================================
        return NextResponse.json(
            { error: `Unknown action: ${action}. Valid actions: create-users, send-emails` },
            { status: 400 }
        );

    } catch (error: any) {
        console.error('❌ Onboarding API fatal error:', error);
        return NextResponse.json({ error: 'Internal server error', details: error.message }, { status: 500 });
    }
}
