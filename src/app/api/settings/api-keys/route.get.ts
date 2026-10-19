import { prisma } from '@/lib/prisma';

// Return list of API keys (simple open endpoint for demo) - in production protect this
export async function GET() {
  const org = await prisma.organization.findFirst({ where: { name: 'AgentGuard (demo)' } });
  if (!org) return new Response(JSON.stringify([]));
  const keys = await prisma.apiKey.findMany({ where: { organizationId: org.id, revokedAt: null }, select: { id: true, name: true, createdAt: true } });
  return new Response(JSON.stringify(keys));
}
