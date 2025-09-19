import './globals.css';
import type { Metadata } from 'next';
import { ReactNode } from 'react';
import { getServerSession } from 'next-auth';
import SessionProvider from '@/components/providers/session-provider';
import { authOptions } from '@/lib/auth';

export const metadata: Metadata = {
  title: 'ECCang Label App',
  description: 'Create ECCang orders and manage shipping labels.',
};

export default async function RootLayout({ children }: { children: ReactNode }) {
  const session = await getServerSession(authOptions);

  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50">
        <SessionProvider session={session}>{children}</SessionProvider>
      </body>
    </html>
  );
}
