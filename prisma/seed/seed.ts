/** Expanded seed script to create demo data: multiple agents, test packs, frameworks, and calibration records. */
import { PrismaClient } from '@prisma/client';
import { sha256Hex, signPayloadHmac } from '../../src/lib/crypto';
import { seededHashToInt } from '../../src/lib/seeded-prng';
import { MockAgentRunner } from '../../src/runners/mock-agent-runner';

const prisma = new PrismaClient();
const DEMO_HMAC_SECRET = process.env.HMAC_SECRET || 'demo_hmac_secret_change_me';

function sample(arr){ return arr[Math.floor(Math.random()*arr.length)]; }

async function main(){
  console.log('Starting expanded seed...');
  // create org and user
  const org = await prisma.organization.upsert({ where: { name: 'AgentGuard (demo)' }, update: {}, create: { name: 'AgentGuard (demo)' } });
  const user = await prisma.user.upsert({ where: { email: 'demo@agentguard.test' }, update: {}, create: { email: 'demo@agentguard.test', name: 'Demo Admin', role: 'admin', organizationId: org.id } });

  // api key
  const rawApiKey = 'demo-public-sdk-key';
  const hashedKey = sha256Hex(rawApiKey);
  await prisma.apiKey.upsert({ where: { name: 'public-sdk' }, update: {}, create: { name: 'public-sdk', hashedKey, role: 'AGENT_REGISTER', organizationId: org.id, description: 'Public SDK registration key (demo)' } });

  // frameworks
  const frameworks = [
    { name: 'ISO/IEC 42001', slug: 'iso-42001' },
    { name: 'NIST AI RMF', slug: 'nist-ai-rmf' },
    { name: 'OWASP Top 10 for Agentic Applications 2026', slug: 'owasp-agentic-2026' },
    { name: 'EU AI Act', slug: 'eu-ai-act' },
    { name: 'DPDP', slug: 'dpdp' }
  ];

  for (const f of frameworks){
    await prisma.regulatoryProfile.upsert({ where: { slug: f.slug }, update: {}, create: { name: f.name, slug: f.slug, description: `${f.name} (seed)` } });
  }

  // create framework controls (small per framework)
  const controls = [];
  controls.push({ framework: 'ISO/IEC 42001', clauseId: 'ISO42001:A.7.3', title: 'Privacy and data handling', description: 'Handle personal data according to requirements' });
  controls.push({ framework: 'ISO/IEC 42001', clauseId: 'ISO42001:A.4.1', title: 'Risk management', description: 'Identify and mitigate AI risks' });
  controls.push({ framework: 'NIST AI RMF', clauseId: 'NIST-AI-RMF:Measure-1', title: 'Performance and robustness', description: 'Measure model performance' });
  controls.push({ framework: 'OWASP', clauseId: 'OWASP-AI-2026:T1', title: 'Prompt injection', description: 'Resist prompt injection' });
  controls.push({ framework: 'EU AI Act', clauseId: 'EU-AI:Art10', title: 'Transparency', description: 'Provide meaningful transparency' });

  for (const c of controls) await prisma.frameworkControl.upsert({ where: { clauseId: c.clauseId }, update: {}, create: c });

  // test pack templates
  const packsTemplates = [
    { name: 'Privacy & PII Handling', slug: 'privacy-pii' },
    { name: 'Prompt Injection & Boundary Escape', slug: 'prompt-injection' },
    { name: 'Tool Misuse & Excessive Agency', slug: 'tool-misuse' },
    { name: 'Memory & State Poisoning', slug: 'memory-poison' },
    { name: 'Hallucination & Grounding', slug: 'hallucination' },
    { name: 'Access Control & Permission Boundaries', slug: 'access-control' },
    { name: 'Transparency & Disclosure', slug: 'transparency' },
    { name: 'Rogue Tool / Supply Chain', slug: 'rogue-tool' },
    { name: 'Multi-Agent Delegation Boundaries', slug: 'multi-agent' }
  ];

  const packIds = [];
  for (const p of packsTemplates){
    const tp = await prisma.testPack.create({ data: { name: p.name, description: `${p.name} seed pack` } });
    packIds.push(tp.id);
    // create between 5 and 12 test cases
    const count = 5 + Math.floor(Math.random()*8);
    for (let i=0;i<count;i++){
      const title = `${p.name} case ${i+1}`;
      const promptTemplate = `Q: Test ${p.name} scenario ${i+1}`;
      const severity = sample(['INFO','LOW','MEDIUM','HIGH','CRITICAL']);
      const frameworkControlIds = ['ISO42001:A.7.3','OWASP-AI-2026:T1','NIST-AI-RMF:Measure-1'].slice(0, 1 + (i%3));
      await prisma.testCase.create({ data: { packId: tp.id, title, promptTemplate, oracleType: 'DETERMINISTIC', expectedBehavior: 'See test description', severity, owaspAsiCategory: `ASI0${(i%10)+1}`, frameworkControlIds } });
    }
  }

  // create 5 demo agents
  const personalities = ['compliant','leaky-pii','prompt-injectable','rogue-tool','hallucinating'];
  for (let i=0;i<5;i++){
    const agent = await prisma.agent.create({ data: { organizationId: org.id, name: `Demo Agent ${i+1}`, description: `Seeded demo agent ${i+1}`, framework: sample(['ISO/IEC 42001','NIST AI RMF','OWASP Top 10 for Agentic Applications 2026']) } });
    const manifest = { tools: ['kb_search','send_email'], personality: personalities[i%personalities.length], dataScopes: ['user:email','user:phone'], endpoint: null };
    const manifestHash = sha256Hex(JSON.stringify(manifest));
    await prisma.agentCard.create({ data: { agentId: agent.id, manifest, manifestHash, version: 1 } });
  }

  // create judge calibration records
  await prisma.calibrationRecord.createMany({ data: [
    { judgeModel: 'demo-judge-v1', agreementRate: 0.92, cohensKappa: 0.85, sampleSize: 200 },
    { judgeModel: 'demo-judge-v2', agreementRate: 0.88, cohensKappa: 0.78, sampleSize: 150 }
  ] });

  console.log('Expanded seed complete.');
}

main().catch(e=>{console.error(e); process.exit(1)}).finally(async ()=>{ await prisma.$disconnect(); });
