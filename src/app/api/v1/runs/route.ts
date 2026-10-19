import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { enqueueRun } from '@/lib/queue-db';
import { seededHashToInt } from '@/lib/seeded-prng';

const CreateRunSchema = z.object({
  agentId: z.string(),
  regulatoryProfileId: z.string().optional(),
  packIds: z.array(z.string()),
  depth: z.enum(['Quick','Standard','Deep']).default('Standard'),
  multiTurn: z.boolean().optional()
});

export async function POST(req: Request) {
  try{
    const body = await req.json();
    const parsed = CreateRunSchema.parse(body);

    // load agent and card
    const agent = await prisma.agent.findUnique({ where: { id: parsed.agentId }, include: { cards: { orderBy: { createdAt: 'desc' }, take: 1 } } });
    if (!agent) return new Response(JSON.stringify({ error: 'agent_not_found' }), { status: 404 });
    const card = agent.cards && agent.cards[0];
    if (!card) return new Response(JSON.stringify({ error: 'agent_card_missing' }), { status: 400 });

    const seed = seededHashToInt(card.id) % 1000000;

    const run = await prisma.run.create({ data: {
      organizationId: agent.organizationId,
      agentId: agent.id,
      agentCardId: card.id,
      regulatoryProfileId: parsed.regulatoryProfileId || null,
      packIds: parsed.packIds,
      status: 'PENDING',
      runnerType: 'MOCK',
      seed
    }});

    // enqueue (DB-backed)
    await enqueueRun(run.id);

    return new Response(JSON.stringify({ id: run.id }), { status: 201 });
  }catch(err:any){
    console.error('create run error', err);
    return new Response(JSON.stringify({ error: 'invalid_request', detail: String(err) }), { status: 400 });
  }
}
