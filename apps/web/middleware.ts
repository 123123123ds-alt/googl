export { default } from 'next-auth/middleware';

export const config = {
  matcher: ['/shipments/:path*', '/labels/:path*'],
};
