'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { Loader2, ArrowLeft, Mail, Lock, Eye, EyeOff } from 'lucide-react';

export default function ForgotPasswordPage() {
    const router = useRouter();
    const [step, setStep] = useState<1 | 2>(1);
    const [email, setEmail] = useState('');
    const [otp, setOtp] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const handleRequestOTP = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const response = await fetch('/api/auth/forgot-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email }),
            });

            const data = await response.json();

            if (response.ok) {
                toast.success('OTP sent!', {
                    description: 'Check your email for the 6-digit code.',
                });
                setStep(2);
            } else {
                toast.error('Error', {
                    description: data.error || 'Failed to send OTP.',
                });
            }
        } catch (err) {
            toast.error('Network error', {
                description: 'Please check your connection.',
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault();

        if (newPassword !== confirmPassword) {
            toast.error('Passwords do not match');
            return;
        }

        if (newPassword.length < 6) {
            toast.error('Password must be at least 6 characters');
            return;
        }

        setIsLoading(true);

        // DEBUG: Log the payload being sent
        console.log('Submitting Step 2 Payload:', { email, otp, newPassword });

        try {
            const response = await fetch('/api/auth/reset-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, otp, newPassword }),
            });

            const data = await response.json();

            // DEBUG: Log the response
            console.log('Step 2 Response:', { status: response.status, data });

            if (response.ok) {
                toast.success('Password reset successful!', {
                    description: 'You can now log in with your new password.',
                });
                router.push('/login');
            } else {
                // Display the specific error message from backend
                toast.error('Failed to reset password', {
                    description: data.error || 'An unknown error occurred.',
                });
            }
        } catch (err) {
            console.error('Network error during password reset:', err);
            toast.error('Network error', {
                description: 'Please check your connection and try again.',
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleResendOTP = async () => {
        setIsLoading(true);
        try {
            const response = await fetch('/api/auth/forgot-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email }),
            });

            if (response.ok) {
                toast.success('OTP resent!', {
                    description: 'Check your email.',
                });
            } else {
                toast.error('Failed to resend OTP');
            }
        } catch (err) {
            toast.error('Network error');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="w-full max-w-md"
            >
                {/* Main Card */}
                <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
                    {/* Header */}
                    <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-8 py-12 text-center relative overflow-hidden">
                        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10"></div>
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                            className="relative w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4 backdrop-blur-sm"
                        >
                            <Lock className="w-10 h-10 text-white" />
                        </motion.div>
                        <h1 className="relative text-3xl font-bold text-white mb-2">Reset Password</h1>
                        <p className="relative text-blue-100 text-sm">
                            {step === 1
                                ? 'Enter your email to receive a verification code'
                                : 'Enter the code we sent to your email'}
                        </p>
                    </div>

                    {/* Progress Indicator */}
                    <div className="flex items-center justify-center px-8 py-4 bg-gray-50 border-b border-gray-100">
                        <div className="flex items-center space-x-2">
                            <div
                                className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-semibold transition-all ${step === 1
                                    ? 'bg-blue-600 text-white shadow-md'
                                    : 'bg-green-500 text-white'
                                    }`}
                            >
                                {step === 1 ? '1' : '✓'}
                            </div>
                            <div className="w-12 h-1 bg-gray-200 rounded">
                                <div
                                    className={`h-full bg-blue-600 rounded transition-all duration-500 ${step === 2 ? 'w-full' : 'w-0'
                                        }`}
                                ></div>
                            </div>
                            <div
                                className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-semibold transition-all ${step === 2
                                    ? 'bg-blue-600 text-white shadow-md'
                                    : 'bg-gray-300 text-gray-500'
                                    }`}
                            >
                                2
                            </div>
                        </div>
                    </div>

                    {/* Form Content */}
                    <div className="px-8 py-8">
                        <AnimatePresence mode="wait">
                            {step === 1 ? (
                                <motion.form
                                    key="step1"
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 20 }}
                                    onSubmit={handleRequestOTP}
                                    className="space-y-6"
                                >
                                    <div>
                                        <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
                                            Email Address
                                        </label>
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                <Mail className="h-5 w-5 text-gray-600 " />
                                            </div>
                                            <input
                                                type="email"
                                                id="email"
                                                value={email}
                                                onChange={(e) => setEmail(e.target.value)}
                                                required
                                                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:shadow-xl transition-all duration-200 outline-none  text-gray-600"
                                                placeholder="your@email.com"
                                                disabled={isLoading}
                                            />
                                        </div>
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={isLoading}
                                        className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold py-3.5 px-4 rounded-lg hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-500/30 transform hover:scale-[1.02] active:scale-[0.98]"
                                    >
                                        {isLoading ? (
                                            <span className="flex items-center justify-center">
                                                <Loader2 className="animate-spin -ml-1 mr-3 h-5 w-5" />
                                                Sending OTP...
                                            </span>
                                        ) : (
                                            'Send OTP'
                                        )}
                                    </button>
                                </motion.form>
                            ) : (
                                <motion.form
                                    key="step2"
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 20 }}
                                    onSubmit={handleResetPassword}
                                    className="space-y-6"
                                >
                                    {/* Success Message */}
                                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                                        <p className="text-sm text-blue-800">
                                            <span className="font-semibold">Code sent to:</span> {email}
                                        </p>
                                    </div>

                                    <div>
                                        <label htmlFor="otp" className="block text-sm font-semibold text-gray-700 mb-2">
                                            6-Digit Code
                                        </label>
                                        <input
                                            type="text"
                                            id="otp"
                                            value={otp}
                                            onChange={(e) => {
                                                const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                                                setOtp(value);
                                            }}
                                            required
                                            maxLength={6}
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 outline-none text-center text-2xl font-mono tracking-widest text-gray-900"
                                            placeholder="______"
                                            disabled={isLoading}
                                        />
                                    </div>

                                    <div>
                                        <label htmlFor="newPassword" className="block text-sm font-semibold text-gray-700 mb-2">
                                            New Password
                                        </label>
                                        <div className="relative">
                                            <input
                                                type={showPassword ? 'text' : 'password'}
                                                id="newPassword"
                                                value={newPassword}
                                                onChange={(e) => setNewPassword(e.target.value)}
                                                required
                                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 outline-none pr-12 text-gray-900"
                                                placeholder="Enter new password"
                                                disabled={isLoading}
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPassword(!showPassword)}
                                                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                                            >
                                                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                            </button>
                                        </div>
                                    </div>

                                    <div>
                                        <label htmlFor="confirmPassword" className="block text-sm font-semibold text-gray-700 mb-2">
                                            Confirm Password
                                        </label>
                                        <div className="relative">
                                            <input
                                                type={showConfirmPassword ? 'text' : 'password'}
                                                id="confirmPassword"
                                                value={confirmPassword}
                                                onChange={(e) => setConfirmPassword(e.target.value)}
                                                required
                                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 outline-none pr-12 text-gray-900"
                                                placeholder="Confirm new password"
                                                disabled={isLoading}
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                                            >
                                                {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                            </button>
                                        </div>
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={isLoading}
                                        className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold py-3.5 px-4 rounded-lg hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-500/30 transform hover:scale-[1.02] active:scale-[0.98]"
                                    >
                                        {isLoading ? (
                                            <span className="flex items-center justify-center">
                                                <Loader2 className="animate-spin -ml-1 mr-3 h-5 w-5" />
                                                Resetting...
                                            </span>
                                        ) : (
                                            'Reset Password'
                                        )}
                                    </button>

                                    {/* Resend OTP */}
                                    <div className="text-center">
                                        <button
                                            type="button"
                                            onClick={handleResendOTP}
                                            disabled={isLoading}
                                            className="text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors disabled:opacity-50"
                                        >
                                            Didn't receive the code? Resend
                                        </button>
                                    </div>

                                    {/* Back Button */}
                                    <div className="text-center pt-2">
                                        <button
                                            type="button"
                                            onClick={() => setStep(1)}
                                            className="inline-flex items-center text-sm text-gray-600 hover:text-gray-800 font-medium transition-colors"
                                        >
                                            <ArrowLeft className="w-4 h-4 mr-1" />
                                            Change email
                                        </button>
                                    </div>
                                </motion.form>
                            )}
                        </AnimatePresence>

                        {/* Back to Login */}
                        <div className="mt-8 pt-6 border-t border-gray-100 text-center">
                            <Link
                                href="/login"
                                className="inline-flex items-center text-sm font-medium text-gray-600 hover:text-gray-800 transition-colors duration-200"
                            >
                                <ArrowLeft className="w-4 h-4 mr-2" />
                                Back to Login
                            </Link>
                        </div>
                    </div>
                </div>

                {/* Sign Up Link */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className="mt-6 text-center"
                >
                    <p className="text-sm text-gray-600">
                        Don't have an account?{' '}
                        <Link
                            href="/signup"
                            className="font-semibold text-blue-600 hover:text-blue-700 transition-colors duration-200"
                        >
                            Sign up
                        </Link>
                    </p>
                </motion.div>
            </motion.div>
        </div>
    );
}
