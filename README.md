# AgentGuard (demo)

Quick start (demo, SQLite):
1. Copy .env.example to .env and edit if desired.
2. pnpm install
3. pnpm db:generate
4. pnpm db:migrate
5. pnpm db:seed
6. pnpm dev
7. In another terminal run scripts/dev-worker.sh to process queued runs (DB fallback)

Notes:
- The dev worker implements a DB-backed queue as a fallback to Redis/BullMQ.
- HttpAgentRunner requires an endpoint in the agent manifest; live runs will show a sandbox warning in the UI.
- Evidence bundles are HMAC-SHA256 signed using HMAC_SECRET (env). For production use KMS and rotate keys.
