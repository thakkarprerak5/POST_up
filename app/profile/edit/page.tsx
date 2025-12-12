"use client";

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import Image from 'next/image';
import { Link } from 'lucide-react';

export default function EditProfilePage() {
  const { data: session, update } = useSession();
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data: user, isLoading } = useQuery({
    queryKey: ['profile'],
    queryFn: async () => {
      const res = await fetch('/api/profile');
      if (!res.ok) throw new Error('Failed to fetch profile');
      return res.json();
    },
  });

  const [formState, setFormState] = useState<any>({});
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);
  const [removeBanner, setRemoveBanner] = useState<boolean>(false);

  useEffect(() => {
    if (user) {
      const profile = user.profile || {};
      setFormState({
        fullName: user.fullName || '',
        email: user.email || '',
        bio: profile.bio || '',
        enrollmentNo: profile.enrollmentNo || '',
        course: profile.course || '',
        branch: profile.branch || '',
        year: profile.year || '',
        skills: (profile.skills || []).join(', '),
        github: profile.socialLinks?.github || '',
        linkedin: profile.socialLinks?.linkedin || '',
        portfolio: profile.socialLinks?.portfolio || '',
        department: profile.department || '',
        expertise: (profile.expertise || []).join(', '),
        position: profile.position || '',
        experience: profile.experience || '',
        researchAreas: (profile.researchAreas || []).join(', '),
        achievements: (profile.achievements || []).join(', '),
        officeHours: profile.officeHours || '',
        bannerColor: profile.bannerColor || '',
      });
      setPreview(user.photo || null);
      setBannerPreview(profile.bannerImage || null);
      setRemoveBanner(false);
    }
  }, [user]);

  useEffect(() => {
    if (!photoFile) return;
    const url = URL.createObjectURL(photoFile);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [photoFile]);

  useEffect(() => {
    if (!bannerFile) return;
    const url = URL.createObjectURL(bannerFile);
    setBannerPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [bannerFile]);

  const updateProfile = useMutation({
    mutationFn: async (fd: FormData) => {
      const res = await fetch('/api/profile', {
        method: 'PATCH',
        body: fd,
      });
      if (!res.ok) {
        const txt = await res.text().catch(() => '');
        throw new Error(`Failed to update profile: ${res.status} ${txt}`);
      }
      return res.json();
    },
    onSuccess: async (data) => {
      // `data` should be the updated user object returned from the API
      try {
        // Update react-query cache so profile page reads latest data immediately
        await queryClient.setQueryData(['profile'], data);

        // Update next-auth session (if available) so navbar/profile picture updates
        if (session?.user) {
          await update({
            ...session,
            user: {
              ...session.user,
              name: data.fullName || session.user.name,
              image: data.photo || session.user.image,
            },
          } as any);
        }
      } catch (e) {
        // swallow; fallback to invalidation below
        console.error('Error updating local cache/session after profile update', e);
      }

      // Ensure future fetches get current data
      await queryClient.invalidateQueries({ queryKey: ['profile'] });
      router.push('/profile');
    },
  });

  const isSaving = Boolean((updateProfile as any).isLoading || (updateProfile as any).isMutating || (updateProfile as any).isPending);

  const onChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormState((s: any) => ({ ...s, [name]: value }));
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setPhotoFile(file);
  };

  const onBannerFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setBannerFile(file);
    // selecting a new banner means we're not removing it
    setRemoveBanner(false);
  };

  const fileInputRef = (null as unknown) as HTMLInputElement | null;

  const triggerFileSelect = () => {
    const el = document.getElementById('profile-file-input') as HTMLInputElement | null;
    if (el) el.click();
  }

  const triggerBannerSelect = () => {
    const el = document.getElementById('banner-file-input') as HTMLInputElement | null;
    if (el) el.click();
  }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const fd = new FormData();
    // Basic fields
    fd.append('fullName', formState.fullName || '');
    fd.append('bio', formState.bio || '');
    fd.append('github', formState.github || '');
    fd.append('linkedin', formState.linkedin || '');
    fd.append('portfolio', formState.portfolio || '');

    // Student fields
    fd.append('enrollmentNo', formState.enrollmentNo || '');
    fd.append('course', formState.course || '');
    fd.append('branch', formState.branch || '');
    fd.append('year', String(formState.year || ''));
    fd.append('skills', formState.skills || '');

    // Mentor fields
    fd.append('department', formState.department || '');
    fd.append('expertise', formState.expertise || '');
    fd.append('position', formState.position || '');
    fd.append('experience', String(formState.experience || ''));
    fd.append('researchAreas', formState.researchAreas || '');
    fd.append('achievements', formState.achievements || '');
    fd.append('officeHours', formState.officeHours || '');

    if (photoFile) fd.append('profileImage', photoFile);
    // If user selected a new banner file, upload it. If they explicitly removed the banner, send an empty string to clear it.
    if (bannerFile) {
      fd.append('bannerImage', bannerFile);
    } else if (removeBanner) {
      fd.append('bannerImage', '');
    }
    fd.append('bannerColor', formState.bannerColor || '');

    updateProfile.mutate(fd);
  };

  if (isLoading || !user) return <div className="p-8">Loading...</div>;

  const isMentor = user.type === 'mentor';

  return (
    <div className="container mx-auto py-12">
      <div className="max-w-4xl mx-auto bg-card border border-border rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-semibold">Edit Profile</h1>
          <div className="text-sm text-muted-foreground">Update your public profile information</div>
        </div>

        <form onSubmit={onSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Left column: avatar & basic actions */}
          <div className="md:col-span-1 flex flex-col items-center">
            <div className="w-full mb-3">
              <div className="w-full h-20 rounded-md overflow-hidden border mb-2">
                {bannerPreview ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={bannerPreview} alt="banner preview" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-muted flex items-center justify-center text-sm">No Banner</div>
                )}
              </div>
              <div className="flex gap-2">
                <Button type="button" variant="default" onClick={triggerBannerSelect}>Change Banner</Button>
                {(bannerPreview || bannerFile) && (
                  <Button type="button" variant="ghost" onClick={() => { setBannerFile(null); setBannerPreview(null); setRemoveBanner(true); }}>Remove Banner</Button>
                )}
              </div>
              <input id="banner-file-input" type="file" accept="image/*" onChange={onBannerFileChange} className="hidden" />
            </div>

            <div className="w-40 h-40 rounded-full overflow-hidden border mb-3">
              {preview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={preview} alt="avatar preview" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-muted flex items-center justify-center text-sm">No Image</div>
              )}
            </div>

            <input id="profile-file-input" type="file" accept="image/*" onChange={onFileChange} className="hidden" />
            <div className="flex flex-col gap-2 w-full">
              <Button type="button" variant="default" onClick={triggerFileSelect}>Change Photo</Button>
              {(preview || photoFile) && (
                <Button type="button" variant="ghost" onClick={() => { setPhotoFile(null); setPreview(null); }}>Remove Photo</Button>
              )}
              <div className="text-xs text-muted-foreground mt-2 text-center">Recommended: 400x400px, JPG or PNG. Max 3MB.</div>
            </div>
          </div>

          {/* Right column: form fields */}
          <div className="md:col-span-2">
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Full name</label>
                <Input name="fullName" value={formState.fullName || ''} onChange={onChange} placeholder="Your full name" />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Bio</label>
                <Textarea name="bio" value={formState.bio || ''} onChange={onChange} placeholder="Short summary about you" />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Banner color</label>
                <input type="color" name="bannerColor" value={formState.bannerColor || '#ffffff'} onChange={(e) => setFormState((s:any)=>({...s, bannerColor: e.target.value}))} className="w-24 h-8 p-0 border rounded" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Email</label>
                  <Input name="email" value={formState.email || ''} onChange={onChange} disabled />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Public role</label>
                  <Input name="role" value={user.type || ''} onChange={onChange} disabled />
                </div>
              </div>

              {!isMentor ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Enrollment No</label>
                    <Input name="enrollmentNo" value={formState.enrollmentNo || ''} onChange={onChange} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Course</label>
                    <Input name="course" value={formState.course || ''} onChange={onChange} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Branch</label>
                    <Input name="branch" value={formState.branch || ''} onChange={onChange} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Year</label>
                    <Input name="year" value={String(formState.year || '')} onChange={onChange} />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium mb-1">Skills</label>
                    <Input name="skills" value={formState.skills || ''} onChange={onChange} placeholder="comma separated" />
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Department</label>
                    <Input name="department" value={formState.department || ''} onChange={onChange} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Position</label>
                    <Input name="position" value={formState.position || ''} onChange={onChange} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Experience (years)</label>
                    <Input name="experience" value={String(formState.experience || '')} onChange={onChange} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Expertise</label>
                    <Input name="expertise" value={formState.expertise || ''} onChange={onChange} placeholder="comma separated" />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium mb-1">Research Areas</label>
                    <Input name="researchAreas" value={formState.researchAreas || ''} onChange={onChange} placeholder="comma separated" />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium mb-1">Achievements</label>
                    <Input name="achievements" value={formState.achievements || ''} onChange={onChange} placeholder="comma separated" />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium mb-1">Office Hours</label>
                    <Input name="officeHours" value={formState.officeHours || ''} onChange={onChange} />
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">GitHub</label>
                  <Input name="github" value={formState.github || ''} onChange={onChange} placeholder="https://github.com/yourname" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">LinkedIn</label>
                  <Input name="linkedin" value={formState.linkedin || ''} onChange={onChange} placeholder="https://linkedin.com/in/yourname" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Portfolio</label>
                  <Input name="portfolio" value={formState.portfolio || ''} onChange={onChange} placeholder="https://your.site" />
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-3">
                <Button variant="outline" type="button" onClick={() => router.back()}>Cancel</Button>
                <Button type="submit" disabled={isSaving}>{isSaving ? 'Saving...' : 'Save changes'}</Button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}