import { prisma } from '@/lib/prisma';
import { sha256Hex } from '@/lib/crypto';

// POST to create API key
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, role, organizationSlug } = body;
    if (!name || !role) return new Response(JSON.stringify({ error: 'missing' }), { status: 400 });

    // For demo, pick demo org
    const org = await prisma.organization.findFirst({ where: { name: 'AgentGuard (demo)' } });
    if (!org) return new Response(JSON.stringify({ error: 'org_not_found' }), { status: 404 });

    const rawKey = 'sk_' + Math.random().toString(36).slice(2, 18);
    const hashed = sha256Hex(rawKey);
    const apiKey = await prisma.apiKey.create({ data: { name, hashedKey: hashed, role: role, organizationId: org.id } });

    return new Response(JSON.stringify({ id: apiKey.id, key: rawKey }), { status: 201 });
  } catch (err: any) {
    console.error(err);
    return new Response(JSON.stringify({ error: 'server_error', detail: String(err) }), { status: 500 });
  }
}

// PATCH to revoke an api key (by id in body)
export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const { id } = body;
    if (!id) return new Response(JSON.stringify({ error: 'missing_id' }), { status: 400 });
    await prisma.apiKey.update({ where: { id }, data: { revokedAt: new Date() } });
    return new Response(JSON.stringify({ ok: true }));
  } catch (err: any) {
    console.error(err);
    return new Response(JSON.stringify({ error: 'server_error', detail: String(err) }), { status: 500 });
  }
}
