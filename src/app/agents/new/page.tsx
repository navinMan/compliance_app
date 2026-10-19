'use client';
import React from 'react';
import { useState } from 'react';

export default function NewAgentPage() {
  const [step, setStep] = useState(1);
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Register Agent</h1>

      <div className="bg-[#131A22] p-4 rounded-md border border-[#1F2A36]">
        <div className="mb-4 text-sm text-[#9AA6B2]">Step {step} of 3</div>
        {step === 1 && (
          <>
            <label className="block mb-2 text-sm text-[#9AA6B2]">Agent name</label>
            <input className="w-full p-2 bg-[#0B0F14] border border-[#1F2A36] rounded" placeholder="My Agent" />
            <div className="mt-4 flex gap-2">
              <button className="px-3 py-2 bg-[#14B8A6] rounded text-black" onClick={() => setStep(2)}>Next</button>
            </div>
          </>
        )}
        {step === 2 && (
          <>
            <div className="text-sm text-[#9AA6B2]">Paste capability manifest (JSON)</div>
            <textarea className="w-full mt-2 p-2 bg-[#0B0F14] border border-[#1F2A36] rounded h-40" placeholder='{"tools":["kb_search"], "personality":"compliant"}' />
            <div className="mt-4 flex gap-2">
              <button className="px-3 py-2 bg-[#0B0F14] border border-[#1F2A36] rounded" onClick={() => setStep(1)}>Back</button>
              <button className="px-3 py-2 bg-[#14B8A6] rounded text-black" onClick={() => setStep(3)}>Next</button>
            </div>
          </>
        )}
        {step === 3 && (
          <>
            <div className="text-sm text-[#9AA6B2]">Connection method</div>
            <div className="mt-2 space-y-2">
              <label className="flex items-center gap-2"><input type="radio" name="conn" /> Mock (choose personality)</label>
              <label className="flex items-center gap-2"><input type="radio" name="conn" /> HTTP endpoint (URL + auth header)</label>
            </div>
            <div className="mt-4 flex gap-2">
              <button className="px-3 py-2 bg-[#0B0F14] border border-[#1F2A36] rounded" onClick={() => setStep(2)}>Back</button>
              <button className="px-3 py-2 bg-[#14B8A6] rounded text-black">Save & Generate SDK Snippet</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
