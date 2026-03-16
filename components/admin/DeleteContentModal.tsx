"use client";

import { useState } from "react";
import { X, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface DeleteContentModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    contentType: string;
    contentTitle?: string;
}

export function DeleteContentModal({
    isOpen,
    onClose,
    onConfirm,
    contentType,
    contentTitle
}: DeleteContentModalProps) {
    const [confirmText, setConfirmText] = useState("");
    const [isDeleting, setIsDeleting] = useState(false);

    if (!isOpen) return null;

    const handleConfirm = async () => {
        if (confirmText !== "DELETE") return;

        setIsDeleting(true);
        await onConfirm();
        setIsDeleting(false);
        setConfirmText("");
        onClose();
    };

    const handleClose = () => {
        setConfirmText("");
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                    <div className="flex items-center gap-3">
                        <div className="bg-red-100 p-2 rounded-lg">
                            <AlertTriangle className="h-5 w-5 text-red-600" />
                        </div>
                        <h2 className="text-xl font-bold text-gray-900">Delete Content</h2>
                    </div>
                    <button
                        onClick={handleClose}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 space-y-4">
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                        <p className="text-red-800 font-semibold mb-2">⚠️ This action is IRREVERSIBLE</p>
                        <p className="text-red-700 text-sm">
                            The {contentType} will be permanently deleted from the database with NO recovery option.
                        </p>
                    </div>

                    {contentTitle && (
                        <div className="bg-gray-50 rounded-lg p-3">
                            <p className="text-sm text-gray-600 mb-1">Content to delete:</p>
                            <p className="text-gray-900 font-medium">{contentTitle}</p>
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Type <span className="font-bold text-red-600">DELETE</span> to confirm
                        </label>
                        <input
                            type="text"
                            value={confirmText}
                            onChange={(e) => setConfirmText(e.target.value)}
                            placeholder="DELETE"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                        />
                    </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50 rounded-b-xl">
                    <Button
                        onClick={handleClose}
                        variant="outline"
                        className="px-4 py-2"
                        disabled={isDeleting}
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleConfirm}
                        disabled={confirmText !== "DELETE" || isDeleting}
                        className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isDeleting ? "Deleting..." : "Permanently Delete"}
                    </Button>
                </div>
            </div>
        </div>
    );
}
