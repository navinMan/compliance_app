import { prisma } from '@/lib/prisma';
import { getServerSession as nextAuthGetServerSession } from 'next-auth/next';
import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { sha256Hex } from './crypto';

export async function getApiKeyFromHeader(authorization?: string) {
  if (!authorization) return null;
  const parts = authorization.split(' ');
  if (parts.length !== 2) return null;
  const [scheme, key] = parts;
  if (!/^ApiKey$/i.test(scheme)) return null;
  const hashed = sha256Hex(key);
  const apiKey = await prisma.apiKey.findFirst({ where: { hashedKey: hashed, revokedAt: null } });
  return apiKey;
}

export const nextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: { email: { label: 'Email', type: 'email' }, password: { label: 'Password', type: 'password' } },
      async authorize(credentials) {
        if (!credentials?.email) return null;
        const user = await prisma.user.findUnique({ where: { email: credentials.email } });
        // For demo: accept any password for existing user
        if (user) return { id: user.id, email: user.email, name: user.name, organizationId: user.organizationId };
        return null;
      }
    })
  ],
  session: { strategy: 'jwt' },
  pages: { signIn: '/auth/signin' }
};

export async function getServerSession(req: Request) {
  // This wrapper is for server routes; NextAuth helper for App Router is different; keep minimal
  // For now attempt to parse cookie-based session via next-auth helper is complex in App Router; return null here for demo
  return null;
}
