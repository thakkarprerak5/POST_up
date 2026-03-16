import { format } from 'date-fns';
import { MapPin, Calendar, Link as LinkIcon, Github, Linkedin, Globe } from 'lucide-react';
import Image from 'next/image';

export default function ProfileHeader({ user, isOwner }: { user: any, isOwner: boolean }) {
    // Safety checks for missing data
    const profile = user?.profile || {};
    const bannerImage = profile.bannerImage || '/defaults/default-banner.jpg'; // Make sure this image exists in public/defaults/
    const avatarImage = user?.photo || user?.photoUrl || `https://ui-avatars.com/api/?name=${user.fullName}&background=random`;
    const joinDate = user?.createdAt ? format(new Date(user.createdAt), 'MMMM yyyy') : 'Recently';

    return (
        <div className="w-full bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden mb-6">

            {/* 1. Top Banner Section */}
            <div className="h-48 w-full relative bg-gradient-to-r from-indigo-500 to-purple-600">
                {profile.bannerImage ? (
                    <Image
                        src={profile.bannerImage}
                        alt="Cover"
                        fill
                        className="object-cover"
                    />
                ) : (
                    <div className="absolute inset-0 bg-slate-200 flex items-center justify-center text-slate-400">
                        {/* Fallback pattern if no banner */}
                        <div className="w-full h-full opacity-10 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-gray-700 via-gray-900 to-black"></div>
                    </div>
                )}
            </div>

            {/* 2. Profile Bar (Avatar + Info) */}
            <div className="px-8 pb-8">
                <div className="relative flex justify-between items-end -mt-16 mb-6">

                    {/* Avatar Circle */}
                    <div className="relative rounded-full p-1.5 bg-white shadow-lg">
                        <div className="relative h-32 w-32 rounded-full overflow-hidden border-2 border-slate-100 bg-slate-50">
                            <Image
                                src={avatarImage}
                                alt={user.fullName || "Profile"}
                                fill
                                className="object-cover"
                            />
                        </div>
                        {/* Online Status Indicator (Optional) */}
                        <div className="absolute bottom-4 right-4 h-5 w-5 bg-green-500 border-4 border-white rounded-full"></div>
                    </div>

                    {/* Action Buttons (Edit Profile) */}
                    {isOwner && (
                        <div className="flex gap-3 mb-2">
                            <button className="px-4 py-2 bg-white border border-slate-300 text-slate-700 font-medium rounded-lg hover:bg-slate-50 transition-colors shadow-sm">
                                Edit Profile
                            </button>
                        </div>
                    )}
                </div>

                {/* 3. User Details */}
                <div className="space-y-4">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
                            {user.fullName || "User Name"}
                            <span className="px-3 py-1 bg-indigo-50 text-indigo-700 text-xs font-semibold rounded-full uppercase tracking-wider border border-indigo-100">
                                {user.type || "Student"}
                            </span>
                        </h1>
                        <p className="text-lg text-slate-600 font-medium mt-1">
                            {profile.course} {profile.branch ? `• ${profile.branch}` : ''}
                        </p>
                        {/* Bio Fallback */}
                        <p className="text-slate-500 mt-2 max-w-2xl leading-relaxed">
                            {profile.bio || "No bio added yet."}
                        </p>
                    </div>

                    {/* 4. Meta Row (Location, Date, Links) */}
                    <div className="flex flex-wrap gap-6 text-slate-500 text-sm border-t border-slate-100 pt-6 mt-6">
                        <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4" />
                            <span>Joined {joinDate}</span>
                        </div>

                        {profile.enrollmentNo && (
                            <div className="flex items-center gap-2">
                                <span className="font-mono bg-slate-100 px-2 py-0.5 rounded text-slate-600">
                                    #{profile.enrollmentNo}
                                </span>
                            </div>
                        )}

                        {/* Social Links */}
                        <div className="flex gap-4 ml-auto">
                            {profile.socialLinks?.github && (
                                <a href={profile.socialLinks.github} target="_blank" className="hover:text-slate-900 transition-colors">
                                    <Github className="w-5 h-5" />
                                </a>
                            )}
                            {profile.socialLinks?.linkedin && (
                                <a href={profile.socialLinks.linkedin} target="_blank" className="hover:text-blue-700 transition-colors">
                                    <Linkedin className="w-5 h-5" />
                                </a>
                            )}
                            {profile.socialLinks?.portfolio && (
                                <a href={profile.socialLinks.portfolio} target="_blank" className="hover:text-indigo-600 transition-colors">
                                    <Globe className="w-5 h-5" />
                                </a>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}