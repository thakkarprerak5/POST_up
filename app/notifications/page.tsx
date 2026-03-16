"use client";

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Filter } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { NotificationItem } from '@/components/notifications/NotificationItem';
import { toast } from 'sonner';

export default function NotificationsPage() {
    const [activeTab, setActiveTab] = useState<'all' | 'unread' | 'high'>('all');
    const queryClient = useQueryClient();

    // Fetch notifications based on active tab
    const { data, isLoading } = useQuery({
        queryKey: ['notifications', activeTab],
        queryFn: async () => {
            let url = '/api/notifications?limit=100';
            if (activeTab === 'unread') {
                url += '&isRead=false';
            } else if (activeTab === 'high') {
                url += '&priority=HIGH';
            }
            const res = await fetch(url);
            if (!res.ok) throw new Error('Failed to fetch notifications');
            return res.json();
        },
        refetchInterval: 30000,
    });

    const notifications = data?.notifications || [];

    // Mark as read mutation
    const markAsReadMutation = useMutation({
        mutationFn: async (notificationId: string) => {
            const res = await fetch('/api/notifications', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ notificationId }),
            });
            if (!res.ok) throw new Error('Failed to mark as read');
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
        },
    });

    // Mark all as read mutation
    const markAllAsReadMutation = useMutation({
        mutationFn: async () => {
            const res = await fetch('/api/notifications', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ markAllRead: true }),
            });
            if (!res.ok) throw new Error('Failed to mark all as read');
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
            toast.success('All notifications marked as read');
        },
    });

    // Delete notification mutation
    const deleteNotificationMutation = useMutation({
        mutationFn: async (notificationId: string) => {
            const res = await fetch(`/api/notifications?id=${notificationId}`, {
                method: 'DELETE',
            });
            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.error || 'Failed to delete notification');
            }
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
            toast.success('Notification deleted');
        },
        onError: (error: any) => {
            toast.error(error.message);
        },
    });

    const handleMarkAsRead = (id: string) => {
        markAsReadMutation.mutate(id);
    };

    const handleDelete = (id: string) => {
        deleteNotificationMutation.mutate(id);
    };

    const handleMarkAllAsRead = () => {
        markAllAsReadMutation.mutate();
    };

    const unreadCount = notifications.filter((n: any) => !n.isRead).length;

    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <div className="sticky top-14 z-40 bg-background/95 backdrop-blur-sm border-b border-border/50">
                <div className="max-w-4xl mx-auto px-4 py-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-bold text-foreground">Notifications</h1>
                            <p className="text-sm text-muted-foreground mt-1">
                                Stay updated with your important activities
                            </p>
                        </div>
                        {unreadCount > 0 && (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleMarkAllAsRead}
                                className="hover:bg-primary/10"
                            >
                                Mark all as read
                            </Button>
                        )}
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-4xl mx-auto px-4 py-6">
                <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full">
                    {/* Filter Tabs */}
                    <TabsList className="grid w-full grid-cols-3 mb-6">
                        <TabsTrigger value="all">All</TabsTrigger>
                        <TabsTrigger value="unread">
                            Unread {unreadCount > 0 && `(${unreadCount})`}
                        </TabsTrigger>
                        <TabsTrigger value="high">High Priority</TabsTrigger>
                    </TabsList>

                    {/* Tab Content */}
                    <TabsContent value={activeTab} className="mt-0">
                        {isLoading ? (
                            <div className="flex items-center justify-center h-64">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
                            </div>
                        ) : notifications.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-64 text-center">
                                <Bell className="h-16 w-16 text-muted-foreground/50 mb-4" />
                                <h3 className="text-lg font-medium text-foreground">No notifications</h3>
                                <p className="text-sm text-muted-foreground mt-2">
                                    {activeTab === 'unread'
                                        ? "You're all caught up!"
                                        : activeTab === 'high'
                                            ? 'No high priority notifications'
                                            : "You don't have any notifications yet"}
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                <AnimatePresence>
                                    {notifications.map((notification: any) => (
                                        <NotificationItem
                                            key={notification._id}
                                            notification={notification}
                                            onMarkAsRead={handleMarkAsRead}
                                            onDelete={handleDelete}
                                        />
                                    ))}
                                </AnimatePresence>
                            </div>
                        )}
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
}
