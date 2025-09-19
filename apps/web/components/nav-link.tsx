'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import clsx from 'classnames';
import type { ReactNode } from 'react';

interface NavLinkProps {
  href: string;
  children: ReactNode;
}

export function NavLink({ href, children }: NavLinkProps) {
  const pathname = usePathname();
  const isActive = pathname === href || pathname?.startsWith(`${href}/`);

  return (
    <Link
      href={href}
      className={clsx(
        'rounded-md px-3 py-2 text-sm font-medium transition-colors',
        isActive
          ? 'bg-blue-600 text-white'
          : 'text-slate-600 hover:bg-slate-200 hover:text-slate-900',
      )}
    >
      {children}
    </Link>
  );
}
