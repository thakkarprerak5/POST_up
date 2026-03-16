// app/api/auth/reset-password/route.ts
import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { connectDB } from '@/lib/db';
import User from '@/models/User';
import { sendPasswordChangedEmail } from '@/lib/mail';

export async function POST(request: NextRequest) {
    try {
        // Safely parse JSON body
        let body;
        try {
            body = await request.json();
        } catch (parseError) {
            console.error('0. Failed to parse JSON body:', parseError);
            return NextResponse.json(
                { error: 'Invalid JSON body.' },
                { status: 400 }
            );
        }

        // 1. Log the received body immediately
        console.log("1. Received Body:", body);

        // Validate body structure
        if (!body || typeof body !== 'object') {
            console.error('1.1 Body is not a valid object:', body);
            return NextResponse.json(
                { error: 'Invalid request body.' },
                { status: 400 }
            );
        }

        const { email, otp, newPassword } = body;

        // Log individual field presence
        console.log('1.2 Field check:', {
            hasEmail: !!email,
            hasOtp: !!otp,
            hasNewPassword: !!newPassword,
            emailType: typeof email,
            otpType: typeof otp,
            newPasswordType: typeof newPassword,
            otpLength: typeof otp === 'string' ? otp.length : undefined
        });

        // Validate all fields present
        if (!email || !otp || !newPassword) {
            const missing = [];
            if (!email) missing.push('email');
            if (!otp) missing.push('otp');
            if (!newPassword) missing.push('newPassword');
            console.error('1.3 Missing required fields:', missing);
            return NextResponse.json(
                { error: `Missing required fields: ${missing.join(', ')}` },
                { status: 400 }
            );
        }

        // Validate field types
        if (typeof email !== 'string') {
            console.error('1.4 Email is not a string:', typeof email);
            return NextResponse.json(
                { error: 'Email must be a string.' },
                { status: 400 }
            );
        }

        if (typeof otp !== 'string') {
            console.error('1.5 OTP is not a string:', typeof otp);
            return NextResponse.json(
                { error: 'OTP must be a string.' },
                { status: 400 }
            );
        }

        if (typeof newPassword !== 'string') {
            console.error('1.6 New password is not a string:', typeof newPassword);
            return NextResponse.json(
                { error: 'New password must be a string.' },
                { status: 400 }
            );
        }

        // Validate OTP format (must be 6 digits)
        if (!/^\d{6}$/.test(otp)) {
            console.error('1.7 Invalid OTP format:', { otp, length: otp.length });
            return NextResponse.json(
                { error: 'Invalid OTP format. Must be exactly 6 digits.' },
                { status: 400 }
            );
        }

        // Validate password strength
        if (newPassword.length < 6) {
            console.error('1.8 Password too short:', newPassword.length);
            return NextResponse.json(
                { error: 'Password must be at least 6 characters long' },
                { status: 400 }
            );
        }

        // Connect to database
        await connectDB();

        // Find user by email and CRUCIALLY select hidden OTP fields
        const normalizedEmail = email.toLowerCase().trim();
        console.log('1.9 Searching for user with email:', normalizedEmail);

        const user = await User.findOne({
            email: normalizedEmail
        }).select('+resetOtp +otpExpires');

        // 2. Log whether user was found
        console.log("2. User found:", user ? "Yes" : "No");

        if (!user) {
            console.error('2.1 User not found for email:', normalizedEmail);
            return NextResponse.json(
                { error: 'No account found with this email address' },
                { status: 400 }
            );
        }

        // 3. Log the database values for OTP and expiration
        console.log("3. DB OTP:", user?.resetOtp, "Expires:", user?.otpExpires);
        console.log('3.1 DB OTP details:', {
            email: user.email,
            resetOtpType: typeof user.resetOtp,
            resetOtpValue: user.resetOtp,
            otpExpiresType: user.otpExpires instanceof Date ? 'Date' : typeof user.otpExpires,
            otpExpiresValue: user.otpExpires,
            otpExpiresISO: user.otpExpires?.toISOString?.(),
            now: new Date().toISOString()
        });

        // Check if OTP exists in database
        if (!user.resetOtp) {
            console.error('3.2 No resetOtp found in database for user:', user.email);
            return NextResponse.json(
                { error: 'The OTP does not match.' },
                { status: 400 }
            );
        }

        // Check if OTP has expired
        if (!user.otpExpires) {
            console.error('3.3 No otpExpires found in database for user:', user.email);
            return NextResponse.json(
                { error: 'The OTP has expired.' },
                { status: 400 }
            );
        }

        // 4. Validate OTP expiration
        const now = Date.now();
        const expiresAt = new Date(user.otpExpires).getTime();
        console.log('4. Expiration check:', {
            now,
            expiresAt,
            diff: expiresAt - now,
            isExpired: expiresAt < now
        });

        if (user.otpExpires < new Date()) {
            console.error('4.1 OTP has expired:', { expiresAt, now, diff: expiresAt - now });
            // Clear expired OTP
            user.resetOtp = undefined;
            user.otpExpires = undefined;
            await user.save();
            return NextResponse.json(
                { error: "The OTP has expired." },
                { status: 400 }
            );
        }

        // 5. Verify OTP (comparing plain OTP from request with hashed OTP in database)
        // Sanitize input OTP
        const cleanInputOtp = String(otp).trim();
        
        // Aggressive logging for debugging
        console.log("Comparing Input OTP:", cleanInputOtp, "with DB OTP:", user.resetOtp);
        console.log("5.1 OTP comparison details:", {
            inputOtp: cleanInputOtp,
            inputOtpType: typeof cleanInputOtp,
            inputOtpLength: cleanInputOtp.length,
            dbOtp: user.resetOtp,
            dbOtpType: typeof user.resetOtp,
            dbOtpLength: user.resetOtp?.length,
            isDbOtpHashed: user.resetOtp?.startsWith('$2') || false
        });

        // Since OTP is hashed in forgot-password route, use bcrypt.compare
        const isOtpValid = await bcrypt.compare(cleanInputOtp, user.resetOtp);
        console.log('5.2 OTP bcrypt compare result:', isOtpValid);

        if (!isOtpValid) {
            console.error('5.3 The OTP does not match. Provided:', cleanInputOtp, 'DB Hash exists:', !!user.resetOtp);
            return NextResponse.json(
                { error: "The OTP does not match." },
                { status: 400 }
            );
        }

        // 6. Update password
        console.log('6. Updating password for user:', user.email);
        user.password = newPassword; // Will be hashed by pre-save hook

        // Clear OTP fields
        user.resetOtp = undefined;
        user.otpExpires = undefined;

        await user.save();
        console.log('6.1 Password updated and OTP fields cleared successfully');

        // 7. Send confirmation email
        try {
            await sendPasswordChangedEmail({ 
                email: user.email,
                fullName: user.fullName || user.name 
            });
            console.log('7. Confirmation email sent to:', user.email);
        } catch (emailError) {
            console.error('7.1 Failed to send confirmation email:', emailError);
            // Don't fail the request if confirmation email fails
        }

        console.log('✅ Password reset completed successfully for:', user.email);

        return NextResponse.json(
            { message: 'Password has been reset successfully' },
            { status: 200 }
        );

    } catch (error: any) {
        console.error('❌ RESET PASSWORD ERROR:', error);
        console.error('Stack trace:', error.stack);

        return NextResponse.json(
            { error: error.message || 'An error occurred. Please try again later.' },
            { status: 500 }
        );
    }
}
