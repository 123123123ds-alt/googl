import type { ReactNode } from 'react';
import Link from 'next/link';
import { NavLink } from '@/components/nav-link';
import { SignOutButton } from '@/components/sign-out-button';
import { UserBadge } from '@/components/user-badge';

export default function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen">
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-6">
            <Link href="/shipments/new" className="text-lg font-semibold text-slate-900">
              ECCang Label App
            </Link>
            <nav className="flex items-center gap-2">
              <NavLink href="/shipments/new">New Shipment</NavLink>
              <NavLink href="/labels">Labels</NavLink>
            </nav>
          </div>
          <div className="flex items-center gap-4">
            <UserBadge />
            <SignOutButton />
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-6 py-8">{children}</main>
    </div>
  );
}
