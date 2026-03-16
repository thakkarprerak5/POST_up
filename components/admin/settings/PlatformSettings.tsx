"use client";

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function PlatformSettings() {
    const [settings, setSettings] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState('');

    useEffect(() => {
        fetch('/api/admin/settings/platform')
            .then(res => res.json())
            .then(data => {
                if (data.error) throw new Error(data.error);
                setSettings(data);
            })
            .catch(err => console.error(err))
            .finally(() => setLoading(false));
    }, []);

    const handleSave = async () => {
        setSaving(true);
        setMessage('');
        try {
            const res = await fetch('/api/admin/settings/platform', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(settings),
            });
            if (!res.ok) throw new Error('Failed to save');
            setMessage('Settings saved successfully');
        } catch (err) {
            setMessage('Error saving settings');
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div>Loading...</div>;
    if (!settings) return <div>Error loading settings</div>;

    return (
        <center><div className="space-y-6 max-w-3xl">
            <Card className="bg-white shadow-sm border-slate-200">
                <CardHeader className="border-b border-slate-100 pb-4">
                    <CardTitle className="text-xl font-semibold text-slate-900">Platform Configuration</CardTitle>
                    <CardDescription className="text-slate-500">Manage global system behavior and limits.</CardDescription>
                </CardHeader>
                <CardContent className="pt-6 space-y-8">

                    {/* Approval Mode */}
                    <div className="flex items-center justify-between">
                        <div className="space-y-1">
                            <Label className="text-base font-medium text-slate-900">Project Approval Mode</Label>
                            <p className="text-sm text-slate-500">Determine how new projects are approved.</p>
                        </div>
                        <Select
                            value={settings.approvalMode}
                            onValueChange={(val) => setSettings({ ...settings, approvalMode: val })}
                        >
                            <SelectTrigger className="w-[180px] border-slate-300">
                                <SelectValue placeholder="Select mode" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="manual">Manual Review</SelectItem>
                                <SelectItem value="auto">Auto-Approve</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="h-px bg-slate-100" />

                    {/* Toggles Group */}
                    <div className="space-y-6">
                        <div className="flex items-center justify-between">
                            <div className="space-y-1">
                                <Label className="text-base font-medium text-slate-900">Mentor Approval Required</Label>
                                <p className="text-sm text-slate-500">Require mentor sign-off before projects go live.</p>
                            </div>
                            <Switch
                                checked={settings.mentorApprovalRequired}
                                onCheckedChange={(checked) => setSettings({ ...settings, mentorApprovalRequired: checked })}
                            />
                        </div>

                        <div className="flex items-center justify-between">
                            <div className="space-y-1">
                                <Label className="text-base font-medium text-slate-900">Allow Project Uploads</Label>
                                <p className="text-sm text-slate-500">Enable or disable new project submissions.</p>
                            </div>
                            <Switch
                                checked={settings.allowProjectUploads}
                                onCheckedChange={(checked) => setSettings({ ...settings, allowProjectUploads: checked })}
                            />
                        </div>
                    </div>

                    <div className="h-px bg-slate-100" />

                    {/* Group Config */}
                    <div className="space-y-4">
                        <Label className="text-base font-medium text-slate-900">Max Group Size</Label>
                        <div className="flex items-center gap-4">
                            <Input
                                type="number"
                                value={settings.maxGroupSize}
                                onChange={(e) => setSettings({ ...settings, maxGroupSize: parseInt(e.target.value) })}
                                className="max-w-[120px] border-slate-300"
                            />
                            <p className="text-sm text-slate-500">members per group</p>
                        </div>
                    </div>

                    {message && <p className="text-sm text-blue-600 bg-blue-50 p-3 rounded-md border border-blue-100">{message}</p>}

                    <div className="pt-2">
                        <Button onClick={handleSave} disabled={saving} className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-6">
                            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Save Configuration
                        </Button>
                    </div>

                </CardContent>
            </Card>

            {/* Dangerous Zone */}
            <Card className="bg-red-50/50 border-red-100 shadow-sm">
                <CardHeader className="pb-2">
                    <CardTitle className="text-lg font-semibold text-red-700">Danger Zone</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center justify-between">
                        <div className="space-y-1">
                            <Label className="text-base font-medium text-red-900">Maintenance Mode</Label>
                            <p className="text-sm text-red-600">Lock the platform for all non-admin users. Use with caution.</p>
                        </div>
                        <Switch
                            checked={settings.maintenanceMode}
                            onCheckedChange={(checked) => setSettings({ ...settings, maintenanceMode: checked })}
                            className="data-[state=checked]:bg-red-600"
                        />
                    </div>
                </CardContent>
            </Card>
        </div></center>
    );
}
