import React from 'react';

export default async function DashboardPage() {
  // For now the server component will fetch simple KPIs from API endpoints.
  // The UI shows sensible empty states when data is not present.
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-semibold text-white">Dashboard</h1>
      <section className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="p-4 bg-[#131A22] rounded-md border border-[#1F2A36]">
          <div className="text-sm text-[#9AA6B2]">Agents registered</div>
          <div className="text-2xl mt-2 text-[#14B8A6]">—</div>
        </div>
        <div className="p-4 bg-[#131A22] rounded-md border border-[#1F2A36]">
          <div className="text-sm text-[#9AA6B2]">Runs (last 30d)</div>
          <div className="text-2xl mt-2">—</div>
        </div>
        <div className="p-4 bg-[#131A22] rounded-md border border-[#1F2A36]">
          <div className="text-sm text-[#9AA6B2]">Pass rate</div>
          <div className="text-2xl mt-2 text-[#22C55E]">—</div>
        </div>
        <div className="p-4 bg-[#131A22] rounded-md border border-[#1F2A36]">
          <div className="text-sm text-[#9AA6B2]">Open critical findings</div>
          <div className="text-2xl mt-2 text-[#EF4444]">—</div>
        </div>
      </section>

      <section className="bg-[#131A22] p-4 rounded-md border border-[#1F2A36]">
        <h2 className="text-lg font-medium text-white mb-3">Recent runs</h2>
        <div className="text-sm text-[#9AA6B2]">No runs yet — create an agent or run a test pack to see results.</div>
        <div className="mt-4">
          <a href="/agents/new" className="inline-block px-4 py-2 bg-[#14B8A6] rounded text-black font-medium">Register Agent</a>
        </div>
      </section>
    </div>
  );
}
