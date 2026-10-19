'use client';
import React from 'react';
import './globals.css';

export const metadata = {
  title: 'AgentGuard',
  description: 'AgentGuard — AI agent compliance testing'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-[#0B0F14] text-white font-inter min-h-screen">
        <div className="max-w-8xl mx-auto p-6">
          <header className="mb-6 flex items-center justify-between">
            <div className="text-2xl font-bold">AgentGuard</div>
            <nav className="space-x-4 text-sm text-[#9AA6B2]">
              <a href="/" className="hover:underline">Dashboard</a>
              <a href="/agents" className="hover:underline">Agents</a>
              <a href="/runs" className="hover:underline">Runs</a>
              <a href="/evidence" className="hover:underline">Evidence</a>
            </nav>
          </header>
          <main>{children}</main>
        </div>
      </body>
    </html>
  );
}
