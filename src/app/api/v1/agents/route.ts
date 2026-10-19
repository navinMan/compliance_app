import { prisma } from '@/lib/prisma';
import { sha256Hex } from '@/lib/crypto';

// POST /api/v1/agents
export async function POST(req: Request) {
  try {
    const auth = req.headers.get('authorization') || '';
    const parts = auth.split(' ');
    if (parts.length !== 2 || parts[0] !== 'ApiKey') return new Response(JSON.stringify({ error: 'invalid_auth' }), { status: 401 });
    const key = parts[1];
    const hashed = sha256Hex(key);
    const apiKey = await prisma.apiKey.findFirst({ where: { hashedKey: hashed, revokedAt: null } });
    if (!apiKey) return new Response(JSON.stringify({ error: 'invalid_api_key' }), { status: 401 });

    const body = await req.json();
    const { name, description, manifest } = body;
    if (!name || !manifest) return new Response(JSON.stringify({ error: 'missing_fields' }), { status: 400 });

    const agent = await prisma.agent.create({ data: { organizationId: apiKey.organizationId, name, description } });
    const manifestHash = sha256Hex(JSON.stringify(manifest));
    const card = await prisma.agentCard.create({ data: { agentId: agent.id, manifest, manifestHash, version: 1 } });

    return new Response(JSON.stringify({ agent: { id: agent.id, name: agent.name }, agentCard: { id: card.id } }), { status: 201 });
  } catch (err: any) {
    console.error(err);
    return new Response(JSON.stringify({ error: 'server_error', detail: String(err) }), { status: 500 });
  }
}
