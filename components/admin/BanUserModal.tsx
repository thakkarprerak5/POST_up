"use client";

import { useState } from "react";
import { X, UserMinus, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface BanUserModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (banType: 'SOFT_BAN' | 'PROPER_BAN', reason: string) => void;
    userName?: string;
}

export function BanUserModal({
    isOpen,
    onClose,
    onConfirm,
    userName
}: BanUserModalProps) {
    const [banType, setBanType] = useState<'SOFT_BAN' | 'PROPER_BAN' | null>(null);
    const [reason, setReason] = useState("");
    const [isBanning, setIsBanning] = useState(false);

    if (!isOpen) return null;

    const handleConfirm = async () => {
        if (!banType || !reason.trim()) return;

        setIsBanning(true);
        await onConfirm(banType, reason);
        setIsBanning(false);
        setBanType(null);
        setReason("");
        onClose();
    };

    const handleClose = () => {
        setBanType(null);
        setReason("");
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200 flex-shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="bg-red-100 p-2 rounded-lg">
                            <UserMinus className="h-5 w-5 text-red-600" />
                        </div>
                        <h2 className="text-xl font-bold text-gray-900">Ban User</h2>
                    </div>
                    <button
                        onClick={handleClose}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Body - Scrollable */}
                <div className="p-6 space-y-4 overflow-y-auto flex-1">
                    {userName && (
                        <div className="bg-gray-50 rounded-lg p-3">
                            <p className="text-sm text-gray-600 mb-1">User to ban:</p>
                            <p className="text-gray-900 font-medium">{userName}</p>
                        </div>
                    )}

                    {/* Ban Type Selection */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Select Ban Type
                        </label>
                        <div className="space-y-2">
                            <button
                                onClick={() => setBanType('SOFT_BAN')}
                                className={`w-full text-left p-4 rounded-lg border-2 transition-all ${banType === 'SOFT_BAN'
                                    ? 'border-orange-500 bg-orange-50'
                                    : 'border-gray-200 hover:border-orange-300'
                                    }`}
                            >
                                <div className="font-semibold text-gray-900 mb-1">Soft Ban</div>
                                <div className="text-sm text-gray-600">
                                    Account suspended. Content hidden. User sees "Suspended" screen.
                                </div>
                            </button>

                            <button
                                onClick={() => setBanType('PROPER_BAN')}
                                className={`w-full text-left p-4 rounded-lg border-2 transition-all ${banType === 'PROPER_BAN'
                                    ? 'border-red-500 bg-red-50'
                                    : 'border-gray-200 hover:border-red-300'
                                    }`}
                            >
                                <div className="font-semibold text-gray-900 mb-1 flex items-center gap-2">
                                    Proper Ban
                                    <AlertTriangle className="h-4 w-4 text-red-600" />
                                </div>
                                <div className="text-sm text-gray-600">
                                    User sees critical warning. Account will be permanently deleted after 48 hours.
                                </div>
                            </button>
                        </div>
                    </div>

                    {/* Reason */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Reason for Ban
                        </label>
                        <textarea
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            placeholder="Enter the reason for this ban..."
                            rows={3}
                            className="w-full px-4 py-2 text-black border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
                        />
                    </div>

                    {banType === 'PROPER_BAN' && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                            <p className="text-red-800 text-sm font-semibold">
                                ⚠️ Warning: This user's account will be permanently deleted after 48 hours unless resolved.
                            </p>
                        </div>
                    )}
                </div>

                {/* Footer - Fixed at bottom */}
                <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50 rounded-b-xl flex-shrink-0">
                    <Button
                        onClick={handleClose}
                        variant="outline"
                        className="px-4 py-2"
                        disabled={isBanning}
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleConfirm}
                        disabled={!banType || !reason.trim() || isBanning}
                        className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isBanning ? "Banning..." : `Apply ${banType === 'SOFT_BAN' ? 'Soft' : 'Proper'} Ban`}
                    </Button>
                </div>
            </div>
        </div>
    );
}
