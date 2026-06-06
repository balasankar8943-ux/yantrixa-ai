import NextAuth from 'next-auth';
import { authConfig } from './auth.config';

export default NextAuth(authConfig).auth;

export const config = {
  // Protect /chat routes, and handle redirect for login/register if already logged in
  matcher: ['/chat/:path*', '/login', '/register'],
};
