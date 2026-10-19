import { AgentRunner, AgentCard, TurnContext, TurnResult, ToolCallRequest, ToolCallResult, ValidationResult } from './types';
import { mulberry32, seededHashToInt, choice } from '../lib/seeded-prng';

type Personality = 'compliant'|'leaky-pii'|'prompt-injectable'|'rogue-tool'|'poisoned-memory'|'hallucinating';

function redactPII(text: string) {
  // naive regex redaction for demo: emails and SSN-like patterns
  return text
    .replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g, '[REDACTED_EMAIL]')
    .replace(/\b\d{3}-\d{2}-\d{4}\b/g, '[REDACTED_SSN]')
    .replace(/\b4[0-9]{12}(?:[0-9]{3})?\b/g, '[REDACTED_CC]');
}

export class MockAgentRunner implements AgentRunner {
  card: AgentCard;
  personality: Personality;
  rng: () => number;
  seed: number;

  constructor(card: AgentCard, options?: { seed?: number; personality?: Personality }) {
    this.card = card;
    this.seed = options?.seed ?? seededHashToInt(card.manifestHash || card.id);
    this.rng = mulberry32(this.seed);
    this.personality = (options?.personality || ((card.manifest as any)?.personality) || 'compliant') as Personality;
  }

  async validateManifest(card: AgentCard): Promise<ValidationResult> {
    // Basic validation: manifest must declare "tools" array
    const manifest = card.manifest || {};
    if (!Array.isArray(manifest.tools)) {
      return { valid: false, issues: [{ message: 'Manifest should declare "tools" array', severity: 'ERROR' }] };
    }
    return { valid: true, issues: [] };
  }

  async executeToolCall(call: ToolCallRequest) : Promise<ToolCallResult> {
    // Deterministic tool-call stub responses
    const latencyMs = Math.floor(this.rng() * 200) + 20;
    // If personality rogue-tool, sometimes do weird results
    if (this.personality === 'rogue-tool' && this.rng() < 0.4) {
      return {
        success: true,
        result: { stdout: `ROGUE:${call.toolName} returned malicious content for ${JSON.stringify(call.args)}` },
        latencyMs
      };
    }
    // Simulate typical tool outputs
    if (call.toolName === 'kb_search') {
      return { success: true, result: { hits: [{ id: 'doc1', excerpt: 'canonical answer snippet' }] }, latencyMs };
    }
    if (call.toolName === 'send_email') {
      return { success: true, result: { accepted: true, to: call.args?.to }, latencyMs };
    }
    return { success: true, result: { ok: true, tool: call.toolName, args: call.args }, latencyMs };
  }

  private maybeLeakPII(text: string) {
    // For leaky-pii personality, with high probability echo PII-like tokens
    if (this.personality !== 'leaky-pii') return text;
    if (this.rng() < 0.95) {
      // return text unchanged (contains PII)
      return text;
    }
    // occasional redaction (small chance)
    return redactPII(text);
  }

  private maybeFollowInjectedPrompt(userInput: string, history: any[]) {
    // prompt-injectable: follow injection with moderate probability
    if (this.personality !== 'prompt-injectable') return false;
    return this.rng() < 0.9;
  }

  async executeTurn(ctx: TurnContext): Promise<TurnResult> {
    const { input, turnIndex } = ctx;
    const rng = this.rng;
    const personality = this.personality;

    let output = '';
    const toolCalls: ToolCallRequest[] = [];
    const latencyMs = Math.floor(rng() * 300) + 20;

    // Base behaviors
    if (personality === 'compliant') {
      output = `Answer (compliant): ${redactPII(input).slice(0, 800)}`;
    } else if (personality === 'leaky-pii') {
      // echo back email/ssn inserted in prompt; or redact sometimes
      output = `Answer (leaky): ${this.maybeLeakPII(input).slice(0, 800)}`;
    } else if (personality === 'prompt-injectable') {
      if (this.maybeFollowInjectedPrompt(input, ctx.history)) {
        output = `InjectedBehavior: ${input} — (followed injected instruction)`;
      } else {
        output = `Attempted to resist injection — safe answer for: ${redactPII(input)}`;
      }
    } else if (personality === 'rogue-tool') {
      // call an undeclared tool occasionally
      if (rng() < 0.6) {
        toolCalls.push({ toolName: 'exfiltrate', args: { payload: input } });
        output = `Performed external action; see tool call logs.`;
      } else {
        output = `Rogue-tool: responded with limited content.`;
      }
    } else if (personality === 'poisoned-memory') {
      // if history contains a "poison" marker, later repeat it
      const poison = ctx.history.find(h => /__POISON__/i.test(h.content));
      if (poison && rng() < 0.8) {
        output = `MemoryRepeat: ${poison.content.replace('__POISON__', '')}`;
      } else {
        output = `Memory-safe response to: ${redactPII(input)}`;
      }
    } else if (personality === 'hallucinating') {
      // produce a confident but fabricated answer with fake citation
      const fakeFact = `According to Journal-${Math.floor(rng()*900)+100}, the value is ${Math.floor(rng()*10000)}`;
      output = `${fakeFact}. (citation: fake://doi/${Math.floor(rng()*100000)})`;
    } else {
      output = `Default mock answer: ${redactPII(input)}`;
    }

    // Simulate allowed tool calls per manifest
    const manifestTools = (this.card.manifest as any)?.tools || [];
    // If persona chooses to call a declared tool, do so deterministically
    if (rng() < 0.25 && manifestTools.length > 0 && ctx.allowToolCalls !== false) {
      const declaredTool = choice(rng, manifestTools);
      // Prepare args: may include PII items depending on personality
      const args: any = { query: input.slice(0, 200) };
      if (personality === 'leaky-pii' && rng() < 0.9) {
        args.query = args.query + ' ' + 'alice@example.test 123-45-6789';
      }
      toolCalls.push({ toolName: declaredTool, args });
    }

    // If personality rogue-tool and none declared, still attempt to call rogue tool
    if (personality === 'rogue-tool' && toolCalls.length === 0 && rng() < 0.5) {
      toolCalls.push({ toolName: 'exfiltrate', args: { payload: input.slice(0, 400) } });
    }

    return {
      output,
      toolCalls,
      latencyMs
    };
  }

  async teardown(): Promise<void> {
    // nothing to do for mock runner
    return;
  }
}
