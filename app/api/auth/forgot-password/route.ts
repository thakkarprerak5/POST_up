
import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { connectDB } from '@/lib/db';
import User from '@/models/User';
import { sendOtpEmail } from '@/lib/mail';

export async function POST(request: NextRequest) {
    try {
        const { email } = await request.json();

        // Validate email
        if (!email || typeof email !== 'string') {
            return NextResponse.json(
                { error: 'Email is required' },
                { status: 400 }
            );
        }

        // Basic email format validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return NextResponse.json(
                { error: 'Invalid email format' },
                { status: 400 }
            );
        }

        // Connect to database
        await connectDB();

        // Find user by email (need to explicitly select OTP fields)
        const user = await User.findOne({ email: email.toLowerCase() }).select('+resetOtp +otpExpires');

        // SECURITY: Always return the same message regardless of whether user exists
        // This prevents email enumeration attacks
        const genericMessage =
            'If an account exists with that email, a verification code has been sent.';

        if (!user) {
            // User doesn't exist, but we don't reveal this
            console.log(`Password reset requested for non - existent email: ${email} `);
            return NextResponse.json({ message: genericMessage }, { status: 200 });
        }

        // Generate secure 6-digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();

        // Hash the OTP before storing in database
        const salt = await bcrypt.genSalt(10);
        const hashedOtp = await bcrypt.hash(otp, salt);

        // Set OTP and expiration (15 minutes from now)
        user.resetOtp = hashedOtp;
        user.otpExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

        await user.save();

        // Send email with UNHASHED OTP
        try {
            await sendOtpEmail({ 
                email: user.email, 
                otp: otp,
                fullName: user.fullName || user.name 
            });
            console.log(`✅ Password reset OTP sent to: ${user.email} `);
        } catch (emailError) {
            console.error('❌ Failed to send OTP email:', emailError);

            // Clear the OTP since email failed
            user.resetOtp = undefined;
            user.otpExpires = undefined;
            await user.save();

            return NextResponse.json(
                { error: 'Failed to send verification code. Please try again later.' },
                { status: 500 }
            );
        }

        return NextResponse.json({ message: genericMessage }, { status: 200 });
    } catch (error: any) {
        console.error('❌ FORGOT PASSWORD ERROR:', error);

        // Return actual error message for debugging
        return NextResponse.json(
            { error: error.message || 'An error occurred. Please try again later.' },
            { status: 500 }
        );
    }
}
