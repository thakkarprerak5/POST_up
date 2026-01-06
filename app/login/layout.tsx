import { ReactNode } from 'react';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Login - ProjectHub',
  description: 'Login to your ProjectHub account',
};

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center px-4">
      {children}
    </div>
  );
}
