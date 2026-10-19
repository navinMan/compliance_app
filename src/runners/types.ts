export interface AgentCard {
  id: string;
  agentId: string;
  manifest: Record<string, any>;
  manifestHash: string;
  version: number;
}

export type Severity = 'INFO'|'LOW'|'MEDIUM'|'HIGH'|'CRITICAL';

export interface ValidationResult {
  valid: boolean;
  issues: { path?: string; message: string; severity?: 'WARN'|'ERROR' }[];
}

export interface HistoryItem {
  role: 'user'|'assistant'|'tool';
  content: string;
  meta?: Record<string, any>;
}

export interface TurnContext {
  runId: string;
  turnIndex: number;
  input: string;
  history: HistoryItem[];
  seed?: number;
  maxResponseTokens?: number;
  allowToolCalls?: boolean;
  personality?: string;
}

export interface TurnResult {
  output: string;
  toolCalls?: ToolCallRequest[];
  latencyMs?: number;
  metadata?: Record<string, any>;
}

export interface ToolCallRequest {
  toolName: string;
  args: Record<string, any>;
}

export interface ToolCallResult {
  success: boolean;
  result: Record<string, any>;
  latencyMs?: number;
  error?: string;
}

export interface AgentRunner {
  validateManifest(card: AgentCard): Promise<ValidationResult>;
  executeTurn(ctx: TurnContext): Promise<TurnResult>;
  executeToolCall(call: ToolCallRequest): Promise<ToolCallResult>;
  teardown(): Promise<void>;
}
