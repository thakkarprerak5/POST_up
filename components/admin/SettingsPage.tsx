'use client';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { 
  Settings, 
  Users, 
  Shield, 
  AlertTriangle,
  Save,
  RefreshCw,
  UserPlus,
  Mail
} from 'lucide-react';
import { useSession } from 'next-auth/react';

interface SystemSettings {
  maintenance: boolean;
  registrationOpen: boolean;
  projectApprovalRequired: boolean;
  maxProjectsPerUser: number;
  allowProjectDeletion: boolean;
  enableReporting: boolean;
  enableComments: boolean;
  enableLikes: boolean;
  enableSharing: boolean;
}

interface SystemStats {
  totalUsers: number;
  adminUsers: number;
  activeUsers: number;
  blockedUsers: number;
}

export default function SettingsPage() {
  const { data: session } = useSession();
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [newAdminRole, setNewAdminRole] = useState<'admin' | 'super_admin'>('admin');

  const isSuperAdmin = session?.user?.role === 'super_admin';

  useEffect(() => {
    if (isSuperAdmin) {
      fetchSettings();
    }
  }, []);

  const fetchSettings = async () => {
    if (!isSuperAdmin) return;

    try {
      setLoading(true);
      const response = await fetch('/api/admin/settings');
      if (response.ok) {
        const data = await response.json();
        setSettings(data.settings);
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Failed to fetch settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSettings = async () => {
    if (!settings || !isSuperAdmin) return;

    try {
      setSaving(true);
      const response = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settings),
      });

      if (response.ok) {
        // Settings saved successfully
      }
    } catch (error) {
      console.error('Failed to save settings:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleCreateAdmin = async () => {
    if (!newAdminEmail || !isSuperAdmin) return;

    try {
      const response = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: newAdminEmail,
          role: newAdminRole
        }),
      });

      if (response.ok) {
        setNewAdminEmail('');
        fetchSettings(); // Refresh stats
      }
    } catch (error) {
      console.error('Failed to create admin:', error);
    }
  };

  const handleSettingChange = (key: keyof SystemSettings, value: boolean | number) => {
    if (!settings) return;
    setSettings({ ...settings, [key]: value });
  };

  if (!isSuperAdmin) {
    return (
      <div className="flex items-center justify-center h-64 bg-white">
        <div className="text-center">
          <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-black mb-2">Access Restricted</h2>
          <p className="text-black">Only Super Admins can access system settings.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 bg-white">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black"></div>
      </div>
    );
  }

  if (!settings || !stats) {
    return (
      <div className="text-center py-8 bg-white">
        <p className="text-red-600">Failed to load system settings</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 bg-white text-gray-900 p-4">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-black">System Settings</h1>
        <p className="text-black mt-2">
          Manage platform-wide settings and configurations
        </p>
      </div>

      {/* System Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-white border border-black rounded-xl">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-black">Total Users</CardTitle>
            <Users className="h-6 w-6 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-black">{stats.totalUsers}</div>
            <p className="text-xs text-black/70">
              Registered users
            </p>
          </CardContent>
        </Card>

        <Card className="bg-white border border-black rounded-xl">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-black">Admin Users</CardTitle>
            <Shield className="h-6 w-6 text-blue-700" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-black">{stats.adminUsers}</div>
            <p className="text-xs text-black/70">
              Admins and Super Admins
            </p>
          </CardContent>
        </Card>

        <Card className="bg-white border border-black rounded-xl">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-black">Active Users</CardTitle>
            <Users className="h-6 w-6 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-black">{stats.activeUsers}</div>
            <p className="text-xs text-black/70">
              Not blocked
            </p>
          </CardContent>
        </Card>

        <Card className="bg-white border border-black rounded-xl">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-black">Blocked Users</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-black">{stats.blockedUsers}</div>
            <p className="text-xs text-black/70">
              Blocked accounts
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Platform Settings */}
      <Card className="bg-white border border-black rounded-xl">
        <CardHeader>
          <CardTitle className="text-black">Platform Settings</CardTitle>
          <CardDescription className="text-black/70">
            Configure platform-wide features and restrictions
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-black">Access Control</h3>
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Maintenance Mode</Label>
                  <p className="text-sm text-black/70">
                    Disable access to the platform for maintenance
                  </p>
                </div>
                <Switch
                  checked={settings.maintenance}
                  onCheckedChange={(checked) => handleSettingChange('maintenance', checked)}
                  className="data-[state=checked]:bg-blue-700 data-[state=checked]:border-blue-100 [&>span[data-state=checked]]:bg-white [&>span[data-state=checked]]:border-white"
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Open Registration</Label>
                  <p className="text-sm text-black/70">
                    Allow new users to register
                  </p>
                </div>
                <Switch
                  checked={settings.registrationOpen}
                  onCheckedChange={(checked) => handleSettingChange('registrationOpen', checked)}
                  className="data-[state=checked]:bg-blue-700 data-[state=checked]:border-blue-100 [&>span[data-state=checked]]:bg-white [&>span[data-state=checked]]:border-white"
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Project Approval Required</Label>
                  <p className="text-sm text-black/70">
                    Require admin approval for new projects
                  </p>
                </div>
                <Switch
                  checked={settings.projectApprovalRequired}
                  onCheckedChange={(checked) => handleSettingChange('projectApprovalRequired', checked)}
                  className="data-[state=checked]:bg-blue-700 data-[state=checked]:border-blue-100 [&>span[data-state=checked]]:bg-white [&>span[data-state=checked]]:border-white"
                />
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-medium text-black">Feature Toggles</h3>
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Enable Reporting</Label>
                  <p className="text-sm text-black/70">
                    Allow users to report content
                  </p>
                </div>
                <Switch
                  checked={settings.enableReporting}
                  onCheckedChange={(checked) => handleSettingChange('enableReporting', checked)}
                  className="data-[state=checked]:bg-blue-700 data-[state=checked]:border-blue-100 [&>span[data-state=checked]]:bg-white [&>span[data-state=checked]]:border-white"
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Enable Comments</Label>
                  <p className="text-sm text-black/70">
                    Allow commenting on projects
                  </p>
                </div>
                <Switch
                  checked={settings.enableComments}
                  onCheckedChange={(checked) => handleSettingChange('enableComments', checked)}
                  className="data-[state=checked]:bg-blue-700 data-[state=checked]:border-blue-100 [&>span[data-state=checked]]:bg-white [&>span[data-state=checked]]:border-white"
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Enable Likes</Label>
                  <p className="text-sm text-black/70">
                    Allow liking projects
                  </p>
                </div>
                <Switch
                  checked={settings.enableLikes}
                  onCheckedChange={(checked) => handleSettingChange('enableLikes', checked)}
                  className="data-[state=checked]:bg-blue-700 data-[state=checked]:border-blue-100 [&>span[data-state=checked]]:bg-white [&>span[data-state=checked]]:border-white"
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Enable Sharing</Label>
                  <p className="text-sm text-black/70">
                    Allow sharing projects
                  </p>
                </div>
                <Switch
                  checked={settings.enableSharing}
                  onCheckedChange={(checked) => handleSettingChange('enableSharing', checked)}
                  className="data-[state=checked]:bg-blue-700 data-[state=checked]:border-blue-100 [&>span[data-state=checked]]:bg-white [&>span[data-state=checked]]:border-white"
                />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-medium text-black">Project Settings</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="maxProjects">Max Projects per User</Label>
                <Input
                  id="maxProjects"
                  type="number"
                  min="1"
                  max="100"
                  value={settings.maxProjectsPerUser}
                  onChange={(e) => handleSettingChange('maxProjectsPerUser', parseInt(e.target.value))}
                  className="!bg-white text-black border border-black hover:!bg-white focus:!bg-white focus-visible:ring-0 focus-visible:ring-offset-0"
                />
                <p className="text-sm text-black/70">
                  Maximum number of projects a user can create
                </p>
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Allow Project Deletion</Label>
                  <p className="text-sm text-black/70">
                    Allow users to delete their own projects
                  </p>
                </div>
                <Switch
                  checked={settings.allowProjectDeletion}
                  onCheckedChange={(checked) => handleSettingChange('allowProjectDeletion', checked)}
                  className="data-[state=checked]:bg-blue-700 data-[state=checked]:border-blue-100 [&>span[data-state=checked]]:bg-white [&>span[data-state=checked]]:border-white"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <Button onClick={handleSaveSettings} disabled={saving} className="text-white border-black hover:text-white hover:bg-gradient-to-r hover:from-blue-400 hover:to-blue-600 hover:border-blue-600">
              {saving ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Settings
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Admin Management */}
      <Card className="bg-white border border-black rounded-xl">
        <CardHeader>
          <CardTitle className="text-black">Admin Management</CardTitle>
          <CardDescription className="text-black/70">
            Create new admin users and manage permissions
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="adminEmail">User Email</Label>
              <Input
                id="adminEmail"
                type="email"
                placeholder="user@example.com"
                value={newAdminEmail}
                onChange={(e) => setNewAdminEmail(e.target.value)}
                className="!bg-white text-black border border-black hover:!bg-white focus:!bg-white focus-visible:ring-0 focus-visible:ring-offset-0"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="adminRole">Role</Label>

              <Select
                value={newAdminRole}
                onValueChange={(value) =>
                  setNewAdminRole(value as 'admin' | 'super_admin')
                }
              >
                <SelectTrigger
                  id="adminRole"
                  className="
                    w-full
                    !bg-white
                    !text-black
                    border border-black

                    !hover:bg-white
                    !focus:bg-white
                    !active:bg-white

                    data-[state=open]:!bg-white
                    data-[state=closed]:!bg-white

                    focus:ring-1 focus:ring-blue-600
                  "
                >
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>


                <SelectContent className="bg-white text-black border border-black">
                  <SelectItem
                    value="admin"
                    className="cursor-pointer focus:bg-blue-600 focus:text-white"
                  >
                    Admin
                  </SelectItem>

                  <SelectItem
                    value="super_admin"
                    className="cursor-pointer focus:bg-blue-600 focus:text-white"
                  >
                    Super Admin
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            
            <div className="flex items-end">
              <Button onClick={handleCreateAdmin} className="w-full text-white border-black hover:text-white hover:bg-gradient-to-r hover:from-blue-400 hover:to-blue-600 hover:border-blue-600">
                <UserPlus className="h-4 w-4 mr-2" />
                Create Admin
              </Button>
            </div>
          </div>
          
          <div className="bg-white border border-black p-3 rounded">
            <div className="flex items-center space-x-2">
              <Mail className="h-4 w-4 text-black" />
              <span className="text-sm text-black/70">
                The user must already exist in system. They will be promoted to selected role.
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
