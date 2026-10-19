import { prisma } from '@/lib/prisma';

// Agents list page (server component)
export default async function AgentsPage() {
  // For demo, show agents in demo org
  const org = await prisma.organization.findFirst({ where: { name: 'AgentGuard (demo)' } });
  const agents = org ? await prisma.agent.findMany({ where: { organizationId: org.id }, include: { cards: { orderBy: { createdAt: 'desc' } } }) : [];

  return (
    <div className="flex">
      <aside className="w-64 pr-4">
        <div className="bg-[#131A22] p-4 rounded border border-[#1F2A36]">Sidebar</div>
      </aside>
      <div className="flex-1 space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Agents</h1>
          <a href="/agents/new" className="px-3 py-2 bg-[#14B8A6] text-black rounded">Register Agent</a>
        </div>
        <div className="bg-[#131A22] p-4 rounded border border-[#1F2A36]">
          {agents.length === 0 ? (
            <div className="text-[#9AA6B2]">No agents yet. Create one to get started.</div>
          ) : (
            <table className="w-full text-left">
              <thead className="text-[#9AA6B2] text-sm">
                <tr>
                  <th>Name</th>
                  <th>Framework</th>
                  <th>Last Card</th>
                </tr>
              </thead>
              <tbody>
                {agents.map(a => (
                  <tr key={a.id} className="border-t border-[#1F2A36]">
                    <td className="py-2"><a className="text-accent" href={`/agents/${a.id}`}>{a.name}</a></td>
                    <td className="py-2 text-sm text-[#9AA6B2]">{a.framework || '-'}</td>
                    <td className="py-2 text-sm text-[#9AA6B2]">{a.cards && a.cards.length ? new Date(a.cards[0].createdAt).toLocaleString() : '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
