'use client';
import React, { useEffect, useState } from 'react';

export default function SettingsPage() {
  const [keys, setKeys] = useState<any[]>([]);
  const [name, setName] = useState('');
  useEffect(()=>{ fetchKeys(); }, []);
  async function fetchKeys(){
    const res = await fetch('/api/settings/api-keys');
    if (res.ok) { const json = await res.json(); setKeys(json); }
  }
  async function createKey(){
    const res = await fetch('/api/settings/api-keys', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ name, role: 'AGENT_REGISTER' }) });
    const json = await res.json();
    alert('Created key: ' + json.key + '\n(Only shown once)');
    fetchKeys();
  }
  async function revoke(id: string){
    await fetch('/api/settings/api-keys', { method: 'PATCH', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ id }) });
    fetchKeys();
  }
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Settings</h1>
      <section className="bg-[#131A22] p-4 rounded border border-[#1F2A36]">
        <h2 className="text-lg">API Keys</h2>
        <div className="mt-2 flex gap-2">
          <input className="p-2 bg-[#0B0F14] border border-[#1F2A36] rounded flex-1" value={name} onChange={e=>setName(e.target.value)} placeholder="Key name" />
          <button className="px-3 py-2 bg-[#14B8A6] text-black rounded" onClick={createKey}>Create</button>
        </div>
        <div className="mt-4">
          {keys.length===0 ? <div className="text-[#9AA6B2]">No keys</div> : (
            <ul className="space-y-2">
              {keys.map(k=> (
                <li key={k.id} className="p-2 bg-[#0B0F14] rounded border border-[#1F2A36] flex justify-between items-center">{k.name} <button className="px-2 py-1 bg-[#EF4444] rounded" onClick={()=>revoke(k.id)}>Revoke</button></li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
}
