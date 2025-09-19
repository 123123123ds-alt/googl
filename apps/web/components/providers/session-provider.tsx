'use client';

import { SessionProvider as NextSessionProvider } from 'next-auth/react';
import type { Session } from 'next-auth';
import type { ReactNode } from 'react';

interface SessionProviderProps {
  children: ReactNode;
  session: Session | null;
}

export default function SessionProvider({ children, session }: SessionProviderProps) {
  return <NextSessionProvider session={session}>{children}</NextSessionProvider>;
}
