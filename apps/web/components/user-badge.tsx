'use client';

import { useSession } from 'next-auth/react';

export function UserBadge() {
  const { data } = useSession();
  const email = data?.user?.email;

  if (!email) {
    return null;
  }

  return (
    <span className="text-sm text-slate-600">Signed in as {email}</span>
  );
}
