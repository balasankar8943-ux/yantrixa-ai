import type { NextAuthConfig } from 'next-auth';

export const authConfig = {
  pages: {
    signIn: '/login',
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isChat = nextUrl.pathname.startsWith('/chat');
      const isAuthPage = nextUrl.pathname === '/login' || nextUrl.pathname === '/register';

      if (isChat) {
        if (isLoggedIn) return true;
        return false; // Redirect unauthenticated to login
      }
      
      if (isAuthPage && isLoggedIn) {
        return Response.redirect(new URL('/chat', nextUrl));
      }

      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },
  providers: [], // Empty array, defined in auth.ts
} satisfies NextAuthConfig;
