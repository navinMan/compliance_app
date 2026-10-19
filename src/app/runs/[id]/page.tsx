'use client';
import React, { useEffect, useState } from 'react';
import useSWR from 'swr';

interface Run {
  id: string;
  status: string;
  riskScore?: number;
  coveragePct?: number;
  runnerType?: string;
}

export default function RunDetail({ params }: { params: { id: string } }) {
  const runId = params.id;
  const [events, setEvents] = useState<string[]>([]);
  const [status, setStatus] = useState<string>('PENDING');
  const [meta, setMeta] = useState<Run | null>(null);

  useEffect(() => {
    const ctrl = new AbortController();
    const es = new EventSource(`/api/runs/${runId}/stream`);
    es.onmessage = (e) => {
      try {
        const payload = JSON.parse(e.data);
        if (payload.type === 'meta') setMeta(payload.data);
        if (payload.type === 'progress') setEvents(prev => [...prev, payload.data]);
        if (payload.type === 'status') setStatus(payload.data);
      } catch (err) {
        setEvents(prev => [...prev, e.data]);
      }
    };
    es.onerror = () => {
      es.close();
    };
    return () => {
      es.close();
      ctrl.abort();
    };
  }, [runId]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Run {runId}</h1>
        <div className="text-sm text-[#9AA6B2]">Status: <span className="ml-2">{status}</span></div>
      </div>

      <section className="bg-[#131A22] p-4 rounded border border-[#1F2A36]">
        <div className="text-sm text-[#9AA6B2]">Live progress</div>
        <div className="mt-3 space-y-2">
          {events.length === 0 && <div className="text-[#6B7280]">No progress yet.</div>}
          {events.map((e, i) => (
            <div key={i} className="p-2 bg-[#0B0F14] rounded border border-[#1F2A36] font-mono text-sm">{JSON.stringify(e)}</div>
          ))}
        </div>
      </section>
    </div>
  );
}
