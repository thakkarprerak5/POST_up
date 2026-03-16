"use client";

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, ShieldAlert } from "lucide-react";

export default function SecuritySettings() {
    const [settings, setSettings] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState('');

    useEffect(() => {
        fetch('/api/admin/settings/security')
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
            const res = await fetch('/api/admin/settings/security', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(settings),
            });
            if (!res.ok) throw new Error('Failed to save');
            setMessage('Security settings updated');
        } catch (err) {
            setMessage('Error saving settings');
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div>Loading...</div>;
    if (!settings) return <div>Error loading settings</div>;

    return (
        <center><Card className="max-w-3xl bg-white shadow-sm border-slate-200">
            <CardHeader className="border-b border-slate-100 pb-4">
                <div className="flex items-center gap-2">
                    <ShieldAlert className="h-6 w-6 text-blue-600" />
                    <div>
                        <CardTitle className="text-xl font-semibold text-slate-900">Security Configuration</CardTitle>
                        <CardDescription className="text-slate-500">Manage security policies. Changes here affect all users.</CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="pt-6 space-y-8">

                {/* Session & Auth */}
                <div className="space-y-6">
                    <h4 className="text-sm font-semibold text-slate-900 uppercase tracking-wider">Authentication & Session</h4>

                    <div className="flex items-center justify-between">
                        <div className="space-y-1">
                            <Label className="text-base font-medium text-slate-900">Enforce 2FA for Admins</Label>
                            <p className="text-sm text-slate-500">Require two-factor authentication for all admin accounts.</p>
                        </div>
                        <Switch
                            checked={settings.enforce2FA}
                            onCheckedChange={(checked) => setSettings({ ...settings, enforce2FA: checked })}
                        />
                    </div>

                    <div className="grid w-full items-center gap-2">
                        <Label className="text-base font-medium text-slate-900">Session Timeout (Minutes)</Label>
                        <div className="flex items-center gap-4">
                            <Input
                                type="number"
                                value={settings.sessionTimeout}
                                onChange={(e) => setSettings({ ...settings, sessionTimeout: parseInt(e.target.value) })}
                                className="max-w-[120px] border-slate-300"
                            />
                            <p className="text-sm text-slate-500">Auto-logout after inactivity</p>
                        </div>
                    </div>
                </div>

                <div className="h-px bg-slate-100" />

                {/* Password Policy */}
                <div className="space-y-6">
                    <h4 className="text-sm font-semibold text-slate-900 uppercase tracking-wider">Password Policy</h4>
                    <div className="grid gap-6">
                        <div className="grid w-full items-center gap-2">
                            <Label className="text-base font-medium text-slate-900">Minimum Length</Label>
                            <Input
                                type="number"
                                value={settings.passwordPolicy.minLength}
                                onChange={(e) => setSettings({
                                    ...settings,
                                    passwordPolicy: { ...settings.passwordPolicy, minLength: parseInt(e.target.value) }
                                })}
                                className="max-w-[120px] border-slate-300"
                            />
                        </div>
                        <div className="flex items-center justify-between">
                            <div className="space-y-1">
                                <Label className="text-base font-medium text-slate-900">Require Special Characters</Label>
                                <p className="text-sm text-slate-500">Passwords must contain at least one special character (!@#$).</p>
                            </div>
                            <Switch
                                checked={settings.passwordPolicy.requireSpecialChar}
                                onCheckedChange={(checked) => setSettings({
                                    ...settings,
                                    passwordPolicy: { ...settings.passwordPolicy, requireSpecialChar: checked }
                                })}
                            />
                        </div>
                    </div>
                </div>

                {message && <p className="text-sm text-blue-600 bg-blue-50 p-3 rounded-md border border-blue-100">{message}</p>}

                <div className="pt-2">
                    <Button onClick={handleSave} disabled={saving} className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-6">
                        {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Update Security Policy
                    </Button>
                </div>
            </CardContent>
        </Card></center>
    );
}
