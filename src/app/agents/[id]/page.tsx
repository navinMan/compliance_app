import { prisma } from '@/lib/prisma';

export default async function AgentDetail({ params }: { params: { id: string } }) {
  const id = params.id;
  const agent = await prisma.agent.findUnique({ where: { id }, include: { cards: { orderBy: { createdAt: 'desc' } }, runs: true } });
  if (!agent) return <div className="text-[#9AA6B2]">Agent not found</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">{agent.name}</h1>
        <div className="text-sm text-[#9AA6B2]">Framework: {agent.framework || '—'}</div>
      </div>

      <section className="bg-[#131A22] p-4 rounded border border-[#1F2A36]">
        <h2 className="text-lg">Manifest versions</h2>
        <div className="mt-3 space-y-2">
          {agent.cards.map(c => (
            <div key={c.id} className="p-2 bg-[#0B0F14] rounded border border-[#1F2A36]">
              <div className="text-sm text-[#9AA6B2]">Version {c.version} — {new Date(c.createdAt).toLocaleString()}</div>
              <pre className="font-mono text-xs mt-2">{JSON.stringify(c.manifest, null, 2)}</pre>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-[#131A22] p-4 rounded border border-[#1F2A36]">
        <h2 className="text-lg">Runs</h2>
        {agent.runs.length === 0 ? (
          <div className="text-[#9AA6B2]">No runs yet for this agent.</div>
        ) : (
          <ul className="mt-2 space-y-2">
            {agent.runs.map(r => (
              <li key={r.id} className="p-2 bg-[#0B0F14] rounded border border-[#1F2A36]">{r.id} — {r.status}</li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
