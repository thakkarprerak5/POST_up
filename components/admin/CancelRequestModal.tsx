"use client";

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogOverlay,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

interface CancelRequestModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    projectTitle: string;
    isLoading?: boolean;
}

export function CancelRequestModal({
    isOpen,
    onClose,
    onConfirm,
    projectTitle,
    isLoading = false,
}: CancelRequestModalProps) {
    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogOverlay className="bg-black/20 backdrop-blur-sm" />
            <DialogContent className="sm:max-w-lg rounded-3xl !bg-white shadow-2xl border border-red-100/50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 fixed top-[50%] left-[50%] z-50 grid w-full max-w-[calc(100%-2rem)] translate-x-[-50%] translate-y-[-50%] gap-4 p-8 duration-200 sm:max-w-lg">
                <DialogHeader className="space-y-6">
                    <div className="flex items-center gap-5">
                        <div className="p-4 bg-gradient-to-br from-red-500 to-red-600 rounded-2xl shadow-lg shadow-red-500/25">
                            <AlertTriangle className="h-7 w-7 text-white" />
                        </div>
                        <DialogTitle className="text-2xl font-bold text-slate-900">Cancel Assignment Request?</DialogTitle>
                    </div>
                    <DialogDescription className="text-lg text-slate-600 leading-relaxed font-medium">
                        Are you sure you want to cancel the assignment request for{" "}
                        <span className="font-bold text-slate-900">"{projectTitle}"</span>?
                        <br />
                        <br />
                        <span className="text-red-600 font-semibold">This action cannot be undone.</span>
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter className="gap-4 flex-col-reverse sm:flex-row pt-6">
                    <Button
                        variant="outline"
                        onClick={onClose}
                        disabled={isLoading}
                        className="w-full sm:w-auto border-2 border-slate-200/50 text-slate-700 hover:bg-gradient-to-r hover:from-slate-50 hover:to-slate-100 hover:text-slate-900 rounded-2xl font-bold text-base h-14 px-8 transition-all duration-300"
                    >
                        Keep Request
                    </Button>
                    <Button
                        variant="destructive"
                        onClick={onConfirm}
                        disabled={isLoading}
                        className="w-full sm:w-auto bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white shadow-lg shadow-red-500/25 rounded-2xl font-bold text-base h-14 px-8 transition-all duration-300 transform hover:scale-105"
                    >
                        {isLoading ? (
                            <>
                                <div className="animate-spin rounded-full h-5 w-5 border-3 border-white border-t-transparent mr-3" />
                                Confirm Cancel
                            </>
                        ) : (
                            "Confirm Cancel"
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
