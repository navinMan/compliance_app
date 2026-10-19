'use client';
import React, { useState } from 'react';
import { z } from 'zod';

const Step1Schema = z.object({ name: z.string().min(1), description: z.string().optional(), framework: z.string().optional() });
const Step2Schema = z.object({ manifest: z.string().min(2) });

export default function NewAgentWizard() {
  const [step, setStep] = useState(1);
  const [meta, setMeta] = useState({ name: '', description: '', framework: '' });
  const [manifestText, setManifestText] = useState('');
  const [conn, setConn] = useState<'mock'|'http'>('mock');
  const [personality, setPersonality] = useState('compliant');
  const [creating, setCreating] = useState(false);
  const [created, setCreated] = useState(null as any);

  async function handleCreate() {
    try {
      setCreating(true);
      const manifest = JSON.parse(manifestText);
      if (conn === 'mock') manifest.personality = personality;
      const resp = await fetch('/api/agents/create', { method: 'POST', headers: { 'Content-Type':'application/json' }, body: JSON.stringify({ name: meta.name, description: meta.description, framework: meta.framework, manifest }) });
      const json = await resp.json();
      setCreated(json);
      setStep(4);
    } catch (err) {
      alert('Error creating agent: ' + String(err));
    } finally { setCreating(false); }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Register Agent</h1>
      <div className="bg-[#131A22] p-4 rounded border border-[#1F2A36]">
        <div className="mb-4 text-sm text-[#9AA6B2]">Step {step} of 3</div>
        {step === 1 && (
          <div>
            <label className="block text-sm text-[#9AA6B2]">Name</label>
            <input className="w-full p-2 bg-[#0B0F14] border border-[#1F2A36] rounded" value={meta.name} onChange={e=>setMeta({...meta,name:e.target.value})} />
            <label className="block mt-2 text-sm text-[#9AA6B2]">Framework</label>
            <input className="w-full p-2 bg-[#0B0F14] border border-[#1F2A36] rounded" value={meta.framework} onChange={e=>setMeta({...meta,framework:e.target.value})} />
            <div className="mt-4 flex gap-2">
              <button className="px-3 py-2 bg-[#14B8A6] text-black rounded" onClick={()=>setStep(2)}>Next</button>
            </div>
          </div>
        )}
        {step === 2 && (
          <div>
            <div className="text-sm text-[#9AA6B2]">Manifest (JSON)</div>
            <textarea className="w-full mt-2 p-2 bg-[#0B0F14] border border-[#1F2A36] rounded h-48" value={manifestText} onChange={e=>setManifestText(e.target.value)} placeholder='{"tools":["kb_search"], "dataScopes":["user:email"]}' />
            <div className="mt-2 text-sm text-[#9AA6B2]">Paste an A2A agent card to import manifest.</div>
            <div className="mt-4 flex gap-2">
              <button className="px-3 py-2 bg-[#0B0F14] border border-[#1F2A36] rounded" onClick={()=>setStep(1)}>Back</button>
              <button className="px-3 py-2 bg-[#14B8A6] text-black rounded" onClick={()=>setStep(3)}>Next</button>
            </div>
          </div>
        )}
        {step === 3 && (
          <div>
            <div className="text-sm text-[#9AA6B2]">Connection</div>
            <label className="flex items-center gap-2 mt-2"><input type="radio" checked={conn==='mock'} onChange={()=>setConn('mock')} /> Mock</label>
            {conn==='mock' && (
              <div className="mt-2">
                <label className="text-sm text-[#9AA6B2]">Personality</label>
                <select className="w-full p-2 bg-[#0B0F14] border border-[#1F2A36] rounded" value={personality} onChange={e=>setPersonality(e.target.value)}>
                  <option value="compliant">compliant</option>
                  <option value="leaky-pii">leaky-pii</option>
                  <option value="prompt-injectable">prompt-injectable</option>
                  <option value="rogue-tool">rogue-tool</option>
                  <option value="poisoned-memory">poisoned-memory</option>
                  <option value="hallucinating">hallucinating</option>
                </select>
              </div>
            )}
            <label className="flex items-center gap-2 mt-2"><input type="radio" checked={conn==='http'} onChange={()=>setConn('http')} /> HTTP endpoint</label>
            {conn==='http' && (
              <div className="mt-2 text-sm text-[#9AA6B2]">Enter endpoint details in the manifest (endpoint + headers).</div>
            )}
            <div className="mt-4 flex gap-2">
              <button className="px-3 py-2 bg-[#0B0F14] border border-[#1F2A36] rounded" onClick={()=>setStep(2)}>Back</button>
              <button className="px-3 py-2 bg-[#14B8A6] text-black rounded" onClick={handleCreate} disabled={creating}>{creating? 'Creating...':'Save & Generate SDK Snippet'}</button>
            </div>
          </div>
        )}
        {step === 4 && created && (
          <div>
            <div className="text-sm text-[#9AA6B2]">Agent created</div>
            <pre className="bg-[#0B0F14] p-2 mt-2 font-mono rounded text-xs">{JSON.stringify(created, null, 2)}</pre>
            <div className="mt-3">
              <div className="text-sm text-[#9AA6B2]">cURL to register programmatically</div>
              <pre className="bg-[#0B0F14] p-2 mt-2 font-mono rounded text-xs">curl -X POST /api/v1/agents -H "Authorization: ApiKey &lt;YOUR_KEY&gt;" -d '{"name":"'+meta.name+'","manifest":'+manifestText+'}'</pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
