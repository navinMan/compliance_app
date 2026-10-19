import fetch from 'node-fetch';
import { AgentRunner, AgentCard, TurnContext, TurnResult, ToolCallRequest, ToolCallResult, ValidationResult } from './types';

export class HttpAgentRunner implements AgentRunner {
  card: AgentCard;
  runId?: string;
  ephemeralToken?: string;
  timeoutMs: number = 30000;
  constructor(card: AgentCard, options?: { runId?: string }) {
    this.card = card;
    this.runId = options?.runId;
    // ephemeral token would be minted here for the run and passed to remote service
    this.ephemeralToken = `ephemeral-${Date.now()}-${Math.random().toString(36).slice(2,8)}`;
  }

  async validateManifest(card: AgentCard): Promise<ValidationResult> {
    if (!card.manifest?.endpoint) {
      return { valid: false, issues: [{ message: 'HTTP agent requires endpoint in manifest', severity: 'ERROR' }] };
    }
    return { valid: true, issues: [] };
  }

  async executeToolCall(call: ToolCallRequest): Promise<ToolCallResult> {
    // For HTTP runner, tool calls are proxied to the remote endpoint if allowed.
    // This scaffold performs a simple POST and returns JSON.
    try {
      const resp = await fetch((this.card.manifest as any).endpoint + '/tool-call', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.ephemeralToken}`
        },
        body: JSON.stringify(call),
        // enforce timeout by AbortController (omitted for brevity)
      });
      const json = await resp.json();
      return { success: resp.ok, result: json, latencyMs: 0 };
    } catch (err: any) {
      return { success: false, result: {}, error: String(err) };
    }
  }

  async executeTurn(ctx: TurnContext): Promise<TurnResult> {
    // Send chat-like payload to remote agent endpoint. Enforce per-turn 30s timeout.
    const payload = {
      runId: ctx.runId,
      turnIndex: ctx.turnIndex,
      input: ctx.input,
      history: ctx.history
    };
    const AbortController = globalThis.AbortController || (await import('abort-controller')).default;
    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), this.timeoutMs);
    try {
      const resp = await fetch((this.card.manifest as any).endpoint + '/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${this.ephemeralToken}` },
        body: JSON.stringify(payload),
        signal: controller.signal as any
      });
      clearTimeout(t);
      const json = await resp.json();
      // Expect remote to return { output, toolCalls? }
      return { output: json.output || '', toolCalls: json.toolCalls || [], latencyMs: json.latencyMs || 0 };
    } catch (err: any) {
      clearTimeout(t);
      return { output: `Error calling remote agent: ${String(err)}`, toolCalls: [], latencyMs: 0 };
    }
  }

  async teardown(): Promise<void> {
    // revoke ephemeral token if needed (no-op in demo)
    return;
  }
}
