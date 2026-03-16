'use client';

import React from 'react';
import { ShieldX, AlertTriangle, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function BannedPage() {
  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-gray-900 rounded-2xl p-8 text-center border border-red-900/20">
        {/* Banned Icon */}
        <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
          <ShieldX className="w-10 h-10 text-red-500" />
        </div>

        {/* Title */}
        <h1 className="text-2xl font-bold text-white mb-4">
          Account Suspended
        </h1>

        {/* Description */}
        <p className="text-gray-400 mb-6 leading-relaxed">
          Your account has been suspended due to violations of our community guidelines. 
          This suspension is permanent and access to all platform features has been restricted.
        </p>

        {/* Warning Box */}
        <div className="bg-red-900/20 border border-red-800/30 rounded-lg p-4 mb-6">
          <div className="flex items-start space-x-3">
            <AlertTriangle className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" />
            <div className="text-left">
              <p className="text-red-400 font-medium text-sm mb-1">
                Appeal Process
              </p>
              <p className="text-gray-400 text-sm">
                If you believe this suspension is in error, you may contact our support team for review.
              </p>
            </div>
          </div>
        </div>

        {/* Contact Button */}
        <Button 
          variant="outline" 
          className="w-full bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700 hover:text-white transition-colors"
          onClick={() => window.location.href = 'mailto:support@postup.com'}
        >
          <Mail className="w-4 h-4 mr-2" />
          Contact Support
        </Button>

        {/* Footer */}
        <div className="mt-8 pt-6 border-t border-gray-800">
          <p className="text-gray-500 text-xs">
            Post-Up Community Guidelines • Terms of Service • Privacy Policy
          </p>
        </div>
      </div>
    </div>
  );
}
