'use client';

import React, { useState } from 'react';
import Papa from 'papaparse';
import { Upload, Users, Mail, UserPlus, Download, Loader2, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';

/**
 * PREMIUM ONBOARDING SUITE - ULTRA-PREMIUM LIGHT THEME
 * Clean, bright, SaaS-inspired UI for bulk user onboarding
 * 
 * Features:
 * - 4-tab interface: Bulk Student, Bulk Mentor, Single User, Dispatch Emails
 * - Automatic credentials CSV download
 * - Chunked email dispatch (5 users at a time) to prevent Vercel timeouts
 * - Drag-and-drop file upload
 * - Real-time progress tracking
 */

type TabType = 'bulk-student' | 'bulk-mentor' | 'single-user' | 'dispatch-emails';

interface UserCredential {
    fullName: string;
    email: string;
    password: string;
    enrollmentNo?: string;
    type: string;
}

export default function PremiumOnboarding() {
    const [activeTab, setActiveTab] = useState<TabType>('bulk-student');
    const [isLoading, setIsLoading] = useState(false);
    const [uploadedFile, setUploadedFile] = useState<File | null>(null);
    const [parsedData, setParsedData] = useState<any[]>([]);

    // Email dispatch state
    const [emailProgress, setEmailProgress] = useState({ current: 0, total: 0 });
    const [emailResults, setEmailResults] = useState({ success: 0, failed: 0 });
    const [isDispatching, setIsDispatching] = useState(false);

    // Single user form state
    const [singleUserForm, setSingleUserForm] = useState({
        fullName: '',
        email: '',
        type: 'student',
        course: '',
        branch: '',
        department: '',
        position: '',
    });

    /**
     * Download credentials as CSV
     */
    const downloadCredentialsCSV = (users: UserCredential[]) => {
        // CRITICAL: Use camelCase headers to match backend field names
        const csvContent = [
            ['fullName', 'email', 'enrollmentNo', 'password', 'type'],
            ...users.map(user => [
                user.fullName || 'User', // Ensure fullName is never empty
                user.email,
                user.enrollmentNo || '', // Empty string for mentors
                user.password,
                user.type,
            ]),
        ]
            .map(row => row.join(','))
            .join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'postup_generated_credentials.csv';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);

        toast.success('✅ Credentials CSV downloaded!', {
            duration: 4000,
        });
    };

    /**
     * Handle CSV file upload and parsing
     */
    const handleFileUpload = (file: File, userType: 'student' | 'mentor') => {
        setUploadedFile(file);
        setIsLoading(true);

        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: (results) => {
                const data = results.data.map((row: any) => ({
                    ...row,
                    type: userType, // ✅ Inject type based on active tab
                }));

                console.log(`✅ Injected type="${userType}" into ${data.length} users`);
                console.log('Sample user with type:', data[0]);

                setParsedData(data);
                setIsLoading(false);
                toast.success(`📊 Parsed ${data.length} ${userType}(s) from CSV`);
            },
            error: (error) => {
                console.error('CSV parsing error:', error);
                toast.error('❌ Failed to parse CSV file');
                setIsLoading(false);
            },
        });
    };

    /**
     * Create users via API
     */
    const createUsers = async (users: any[]) => {
        setIsLoading(true);

        try {
            const response = await fetch('/api/admin/onboarding', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'create-users',
                    users,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to create users');
            }

            // Download credentials CSV
            downloadCredentialsCSV(data.users);

            toast.success(`✅ Created ${data.created} user(s)!`, {
                duration: 5000,
            });

            // Reset state
            setParsedData([]);
            setUploadedFile(null);

            return data.users;
        } catch (error: any) {
            console.error('Create users error:', error);
            toast.error(`❌ ${error.message}`);
            throw error;
        } finally {
            setIsLoading(false);
        }
    };

    /**
     * Send emails in chunks to prevent Vercel timeout
     */
    const sendEmailsInChunks = async (users: UserCredential[]) => {
        setIsDispatching(true);
        setEmailProgress({ current: 0, total: users.length });
        setEmailResults({ success: 0, failed: 0 });

        const CHUNK_SIZE = 5;
        let successCount = 0;
        let failedCount = 0;

        for (let i = 0; i < users.length; i += CHUNK_SIZE) {
            const chunk = users.slice(i, i + CHUNK_SIZE);

            // Format payload explicitly for backend with comprehensive fallbacks
            const payload = chunk.map(row => {
                // Handle both camelCase and spaced column names
                const fullName = row.fullName || row['Full Name'] || row.FullName || 'User';
                const email = row.email || row.Email || '';
                const password = row.password || row.Password || '';
                const enrollmentNo = row.enrollmentNo || row['Enrollment No'] || row.EnrollmentNo || '';
                const type = row.type || row.Type || 'student'; // ✅ Include type field

                console.log('📧 Preparing email for:', {
                    fullName,
                    email,
                    hasPassword: !!password,
                    enrollmentNo,
                    type, // ✅ Log type
                });

                return {
                    fullName,
                    email,
                    password,
                    enrollmentNo,
                    type, // ✅ Include in payload
                };
            });

            try {
                const response = await fetch('/api/admin/onboarding', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        action: 'send-emails',
                        users: payload,
                    }),
                });

                const data = await response.json();

                if (response.ok) {
                    successCount += data.results.success;
                    failedCount += data.results.failed;
                } else {
                    console.error('Email dispatch error:', data);
                    toast.error(`❌ ${data.error || 'Failed to send emails'}`);
                    failedCount += chunk.length;
                }
            } catch (error) {
                console.error('Email chunk error:', error);
                failedCount += chunk.length;
            }

            // Update progress
            setEmailProgress({ current: i + chunk.length, total: users.length });
            setEmailResults({ success: successCount, failed: failedCount });
        }

        setIsDispatching(false);

        toast.success(`📧 Sent ${successCount} email(s). ${failedCount} failed.`, {
            duration: 6000,
        });
    };

    /**
     * Handle single user creation
     */
    const handleSingleUserSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const userData = {
            fullName: singleUserForm.fullName,
            email: singleUserForm.email,
            type: singleUserForm.type,
            ...(singleUserForm.type === 'student' && {
                course: singleUserForm.course,
                branch: singleUserForm.branch,
            }),
            ...(singleUserForm.type === 'mentor' && {
                department: singleUserForm.department,
                position: singleUserForm.position,
            }),
        };

        try {
            // Create user
            const createdUsers = await createUsers([userData]);

            // Immediately send email
            await sendEmailsInChunks(createdUsers);

            // Reset form
            setSingleUserForm({
                fullName: '',
                email: '',
                type: 'student',
                course: '',
                branch: '',
                department: '',
                position: '',
            });
        } catch (error) {
            console.error('Single user creation error:', error);
        }
    };

    /**
     * Handle email dispatch file upload
     */
    const handleEmailDispatchFileUpload = (file: File) => {
        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: (results) => {
                const users = results.data as UserCredential[];
                sendEmailsInChunks(users);
            },
            error: (error) => {
                console.error('CSV parsing error:', error);
                toast.error('❌ Failed to parse credentials CSV');
            },
        });
    };

    return (
        <div className="min-h-screen bg-slate-50 p-8">
            <div className="max-w-7xl mx-auto">

                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-4xl font-bold text-slate-900 mb-2">
                        User Onboarding Suite
                    </h1>
                    <p className="text-slate-600 text-lg">
                        Bulk user creation and credential management system
                    </p>
                </div>

                {/* Main Card */}
                <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-200/60 overflow-hidden">

                    {/* Tab Navigation */}
                    <div className="flex border-b border-slate-200/60 bg-slate-50/50">
                        <TabButton
                            active={activeTab === 'bulk-student'}
                            onClick={() => setActiveTab('bulk-student')}
                            icon={<Users className="w-5 h-5" />}
                            label="Bulk Student Upload"
                        />
                        <TabButton
                            active={activeTab === 'bulk-mentor'}
                            onClick={() => setActiveTab('bulk-mentor')}
                            icon={<Users className="w-5 h-5" />}
                            label="Bulk Mentor Upload"
                        />
                        <TabButton
                            active={activeTab === 'single-user'}
                            onClick={() => setActiveTab('single-user')}
                            icon={<UserPlus className="w-5 h-5" />}
                            label="Single User"
                        />
                        <TabButton
                            active={activeTab === 'dispatch-emails'}
                            onClick={() => setActiveTab('dispatch-emails')}
                            icon={<Mail className="w-5 h-5" />}
                            label="Dispatch Emails"
                        />
                    </div>

                    {/* Tab Content */}
                    <div className="p-8">

                        {/* Bulk Student Upload */}
                        {activeTab === 'bulk-student' && (
                            <BulkUploadTab
                                userType="student"
                                uploadedFile={uploadedFile}
                                parsedData={parsedData}
                                isLoading={isLoading}
                                onFileUpload={(file) => handleFileUpload(file, 'student')}
                                onCreateUsers={() => createUsers(parsedData)}
                            />
                        )}

                        {/* Bulk Mentor Upload */}
                        {activeTab === 'bulk-mentor' && (
                            <BulkUploadTab
                                userType="mentor"
                                uploadedFile={uploadedFile}
                                parsedData={parsedData}
                                isLoading={isLoading}
                                onFileUpload={(file) => handleFileUpload(file, 'mentor')}
                                onCreateUsers={() => createUsers(parsedData)}
                            />
                        )}

                        {/* Single User Creation */}
                        {activeTab === 'single-user' && (
                            <SingleUserTab
                                form={singleUserForm}
                                setForm={setSingleUserForm}
                                isLoading={isLoading}
                                onSubmit={handleSingleUserSubmit}
                            />
                        )}

                        {/* Dispatch Emails */}
                        {activeTab === 'dispatch-emails' && (
                            <DispatchEmailsTab
                                isDispatching={isDispatching}
                                progress={emailProgress}
                                results={emailResults}
                                onFileUpload={handleEmailDispatchFileUpload}
                            />
                        )}

                    </div>
                </div>

            </div>
        </div>
    );
}

// ============================================================
// TAB BUTTON COMPONENT
// ============================================================
function TabButton({
    active,
    onClick,
    icon,
    label,
}: {
    active: boolean;
    onClick: () => void;
    icon: React.ReactNode;
    label: string;
}) {
    return (
        <button
            onClick={onClick}
            className={`flex items-center gap-2 px-6 py-4 font-medium transition-all duration-200 border-b-2 ${active
                ? 'bg-white text-indigo-600 border-indigo-600 shadow-sm'
                : 'text-slate-600 border-transparent hover:text-slate-900 hover:bg-white/50'
                }`}
        >
            {icon}
            <span>{label}</span>
        </button>
    );
}

// ============================================================
// BULK UPLOAD TAB
// ============================================================
function BulkUploadTab({
    userType,
    uploadedFile,
    parsedData,
    isLoading,
    onFileUpload,
    onCreateUsers,
}: {
    userType: 'student' | 'mentor';
    uploadedFile: File | null;
    parsedData: any[];
    isLoading: boolean;
    onFileUpload: (file: File) => void;
    onCreateUsers: () => void;
}) {
    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        const file = e.dataTransfer.files[0];
        if (file && file.type === 'text/csv') {
            onFileUpload(file);
        } else {
            toast.error('❌ Please upload a CSV file');
        }
    };

    const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            onFileUpload(file);
        }
    };

    return (
        <div className="space-y-6">

            {/* Instructions */}
            <div className="bg-indigo-50 border border-indigo-200/60 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-indigo-900 mb-3 flex items-center gap-2">
                    <AlertCircle className="w-5 h-5" />
                    CSV Format Instructions
                </h3>
                <p className="text-slate-700 mb-3">
                    Upload a CSV file with the following columns:
                </p>
                <code className="block bg-white p-3 rounded-lg text-sm text-slate-800 font-mono border border-indigo-200/40">
                    {userType === 'student'
                        ? 'fullName, email, course, branch'
                        : 'fullName, email, department, position'}
                </code>
                <p className="text-slate-600 text-sm mt-3">
                    ⚠️ Do not include "Type" or "Enrollment No" columns - these are auto-generated.
                </p>
            </div>

            {/* Drag & Drop Upload */}
            <div
                onDrop={handleDrop}
                onDragOver={(e) => e.preventDefault()}
                className="border-2 border-dashed border-slate-300 rounded-xl p-12 text-center hover:border-indigo-400 hover:bg-indigo-50/30 transition-all duration-300 cursor-pointer group"
            >
                <input
                    type="file"
                    accept=".csv"
                    onChange={handleFileInput}
                    className="hidden"
                    id="csv-upload"
                />
                <label htmlFor="csv-upload" className="cursor-pointer">
                    <Upload className="w-16 h-16 mx-auto mb-4 text-indigo-500 group-hover:text-indigo-600 transition-colors" />
                    <p className="text-xl font-semibold text-slate-900 mb-2">
                        {uploadedFile ? uploadedFile.name : 'Drop CSV file here or click to browse'}
                    </p>
                    <p className="text-slate-600">
                        Supports CSV files only
                    </p>
                </label>
            </div>

            {/* Preview Table */}
            {parsedData.length > 0 && (
                <div className="bg-slate-50 border border-slate-200/60 rounded-xl p-6">
                    <h3 className="text-lg font-semibold text-slate-900 mb-4">
                        Preview ({parsedData.length} {userType}s)
                    </h3>
                    <div className="overflow-x-auto max-h-96 bg-white rounded-lg border border-slate-200/60">
                        <table className="w-full text-sm text-left">
                            <thead className="text-xs uppercase text-slate-600 border-b border-slate-200/60 bg-slate-50">
                                <tr>
                                    <th className="px-4 py-3">Full Name</th>
                                    <th className="px-4 py-3">Email</th>
                                    {userType === 'student' && (
                                        <>
                                            <th className="px-4 py-3">Course</th>
                                            <th className="px-4 py-3">Branch</th>
                                        </>
                                    )}
                                    {userType === 'mentor' && (
                                        <>
                                            <th className="px-4 py-3">Department</th>
                                            <th className="px-4 py-3">Position</th>
                                        </>
                                    )}
                                </tr>
                            </thead>
                            <tbody>
                                {parsedData.slice(0, 10).map((row, idx) => (
                                    <tr key={idx} className="border-b border-slate-200/40 text-slate-700 hover:bg-slate-50">
                                        <td className="px-4 py-3">{row.fullName}</td>
                                        <td className="px-4 py-3">{row.email}</td>
                                        {userType === 'student' && (
                                            <>
                                                <td className="px-4 py-3">{row.course}</td>
                                                <td className="px-4 py-3">{row.branch}</td>
                                            </>
                                        )}
                                        {userType === 'mentor' && (
                                            <>
                                                <td className="px-4 py-3">{row.department}</td>
                                                <td className="px-4 py-3">{row.position}</td>
                                            </>
                                        )}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {parsedData.length > 10 && (
                            <p className="text-slate-500 text-sm mt-3 text-center py-2">
                                ... and {parsedData.length - 10} more
                            </p>
                        )}
                    </div>
                </div>
            )}

            {/* Create Users Button */}
            {parsedData.length > 0 && (
                <button
                    onClick={onCreateUsers}
                    disabled={isLoading}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-4 px-6 rounded-xl shadow-lg shadow-indigo-500/20 hover:shadow-xl hover:shadow-indigo-500/30 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                    {isLoading ? (
                        <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            Creating Users...
                        </>
                    ) : (
                        <>
                            <CheckCircle2 className="w-5 h-5" />
                            Create {parsedData.length} User(s) & Download Credentials
                        </>
                    )}
                </button>
            )}

        </div>
    );
}

// ============================================================
// SINGLE USER TAB
// ============================================================
function SingleUserTab({
    form,
    setForm,
    isLoading,
    onSubmit,
}: {
    form: any;
    setForm: (form: any) => void;
    isLoading: boolean;
    onSubmit: (e: React.FormEvent) => void;
}) {
    return (
        <form onSubmit={onSubmit} className="space-y-6 max-w-2xl mx-auto">

            {/* User Type Selection */}
            <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">User Type</label>
                <div className="flex gap-4">
                    <button
                        type="button"
                        onClick={() => setForm({ ...form, type: 'student' })}
                        className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all ${form.type === 'student'
                            ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                    >
                        Student
                    </button>
                    <button
                        type="button"
                        onClick={() => setForm({ ...form, type: 'mentor' })}
                        className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all ${form.type === 'mentor'
                            ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                    >
                        Mentor
                    </button>
                </div>
            </div>

            {/* Full Name */}
            <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Full Name</label>
                <input
                    type="text"
                    required
                    value={form.fullName}
                    onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                    className="w-full bg-white border border-slate-300 rounded-lg px-4 py-3 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="John Doe"
                />
            </div>

            {/* Email */}
            <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Email Address</label>
                <input
                    type="email"
                    required
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="w-full bg-white border border-slate-300 rounded-lg px-4 py-3 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="john@example.com"
                />
            </div>

            {/* Student Fields */}
            {form.type === 'student' && (
                <>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Course</label>
                            <input
                                type="text"
                                required
                                value={form.course}
                                onChange={(e) => setForm({ ...form, course: e.target.value })}
                                className="w-full bg-white border border-slate-300 rounded-lg px-4 py-3 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                placeholder="B.Tech"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Branch</label>
                            <input
                                type="text"
                                required
                                value={form.branch}
                                onChange={(e) => setForm({ ...form, branch: e.target.value })}
                                className="w-full bg-white border border-slate-300 rounded-lg px-4 py-3 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                placeholder="Computer Science"
                            />
                        </div>
                    </div>
                </>
            )}

            {/* Mentor Fields */}
            {form.type === 'mentor' && (
                <>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Department</label>
                            <input
                                type="text"
                                required
                                value={form.department}
                                onChange={(e) => setForm({ ...form, department: e.target.value })}
                                className="w-full bg-white border border-slate-300 rounded-lg px-4 py-3 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                placeholder="Computer Science"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Position</label>
                            <input
                                type="text"
                                required
                                value={form.position}
                                onChange={(e) => setForm({ ...form, position: e.target.value })}
                                className="w-full bg-white border border-slate-300 rounded-lg px-4 py-3 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                placeholder="Professor"
                            />
                        </div>
                    </div>
                </>
            )}

            {/* Submit Button */}
            <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-4 px-6 rounded-xl shadow-lg shadow-indigo-500/20 hover:shadow-xl hover:shadow-indigo-500/30 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
                {isLoading ? (
                    <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Creating User...
                    </>
                ) : (
                    <>
                        <UserPlus className="w-5 h-5" />
                        Create User & Send Email
                    </>
                )}
            </button>

        </form>
    );
}

// ============================================================
// DISPATCH EMAILS TAB
// ============================================================
function DispatchEmailsTab({
    isDispatching,
    progress,
    results,
    onFileUpload,
}: {
    isDispatching: boolean;
    progress: { current: number; total: number };
    results: { success: number; failed: number };
    onFileUpload: (file: File) => void;
}) {
    const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            onFileUpload(file);
        }
    };

    const progressPercentage = progress.total > 0 ? (progress.current / progress.total) * 100 : 0;

    return (
        <div className="space-y-6">

            {/* Instructions */}
            <div className="bg-indigo-50 border border-indigo-200/60 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-indigo-900 mb-3 flex items-center gap-2">
                    <Mail className="w-5 h-5" />
                    Email Dispatch Instructions
                </h3>
                <p className="text-slate-700 mb-3">
                    Upload the <code className="bg-white px-2 py-1 rounded text-indigo-700 border border-indigo-200/40">postup_generated_credentials.csv</code> file that was downloaded after creating users.
                </p>
                <p className="text-slate-600 text-sm">
                    ⚡ Emails are sent in chunks of 5 to prevent server timeouts. Large batches may take several minutes.
                </p>
            </div>

            {/* Upload Area */}
            {!isDispatching && (
                <div className="border-2 border-dashed border-slate-300 rounded-xl p-12 text-center hover:border-indigo-400 hover:bg-indigo-50/30 transition-all duration-300 cursor-pointer group">
                    <input
                        type="file"
                        accept=".csv"
                        onChange={handleFileInput}
                        className="hidden"
                        id="credentials-upload"
                    />
                    <label htmlFor="credentials-upload" className="cursor-pointer">
                        <Download className="w-16 h-16 mx-auto mb-4 text-indigo-500 group-hover:text-indigo-600 transition-colors" />
                        <p className="text-xl font-semibold text-slate-900 mb-2">
                            Upload Credentials CSV
                        </p>
                        <p className="text-slate-600">
                            Click to browse or drop file here
                        </p>
                    </label>
                </div>
            )}

            {/* Progress UI */}
            {isDispatching && (
                <div className="bg-slate-50 border border-slate-200/60 rounded-xl p-8">

                    {/* Progress Bar */}
                    <div className="mb-6">
                        <div className="flex justify-between text-sm text-slate-700 mb-2">
                            <span>Dispatching Emails...</span>
                            <span className="font-semibold">{progress.current} / {progress.total}</span>
                        </div>
                        <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden">
                            <div
                                className="h-full bg-indigo-600 transition-all duration-500 ease-out shadow-lg"
                                style={{ width: `${progressPercentage}%` }}
                            />
                        </div>
                        <p className="text-center text-slate-600 text-sm mt-2">
                            {progressPercentage.toFixed(0)}% Complete
                        </p>
                    </div>

                    {/* Results */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-green-50 border border-green-200/60 rounded-lg p-4 flex items-center gap-3">
                            <CheckCircle2 className="w-8 h-8 text-green-600" />
                            <div>
                                <p className="text-2xl font-bold text-green-700">{results.success}</p>
                                <p className="text-sm text-slate-600">Successful</p>
                            </div>
                        </div>
                        <div className="bg-red-50 border border-red-200/60 rounded-lg p-4 flex items-center gap-3">
                            <XCircle className="w-8 h-8 text-red-600" />
                            <div>
                                <p className="text-2xl font-bold text-red-700">{results.failed}</p>
                                <p className="text-sm text-slate-600">Failed</p>
                            </div>
                        </div>
                    </div>

                </div>
            )}

        </div>
    );
}
