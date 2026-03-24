# Kosbling Sim2Real OS

Kosbling Sim2Real OS is now a CLI-first, shadow-first TypeScript runtime for running commerce ideas through a staged 30-day simulation.

If you want the implementation contract, start here:

- [`implementation/v0.1-codex-implementation-brief.md`](./implementation/v0.1-codex-implementation-brief.md)
- [`implementation/v0.2-implementation-brief.md`](./implementation/v0.2-implementation-brief.md)

## What is implemented in v0.1

The current build is a local CLI with:

- natural-language idea intake
- CEO-agent scenario formation
- multi-agent chunk planning with CEO + marketing + supply + finance + brand role proposals
- execution-agent mediated action commits through a shared adapter boundary
- Brave web search grounding
- optional Google Trends enrichment
- 30-day shadow execution in 5-day chunks
- optional Shopify live execution for price updates
- pause and resume support
- coarse CLI process logs for grounding, planning, execution, and settlement
- market snapshot, chunk update, and final battle report artifacts

Current v0.1 boundary:

- v0.1 is best treated as a post-setup operating simulator
- it initializes a shadow store/world quickly from the idea and defaults
- the fuller “from supplier selection and launch prep to first sale” setup journey is now planned for v0.2

There is still no GUI, IM integration, or full live ads / ops surface in this version. The first live write path is a minimal Shopify store adapter for approved price updates.

## Multi-Agent Runtime

The current v0.1 runtime now uses:

- `Kos / CEO` for idea intake, clarification, role-plan merge, and event generation
- specialist role agents for `marketing`, `supply`, `finance`, and `brand`
- an execution agent that calls the runtime adapter through tool use
- a sequential orchestration loop where specialists propose structured actions plus watchouts and handoff tickets, the CEO merges them with a rationale, and the execution agent commits them through the active adapter
- recent chunk history is compressed into team memory and fed back into the next round of role planning and CEO arbitration
- open handoffs can stay active across chunks until the assigned role explicitly acknowledges them

This is still a local shadow runtime by default.
The execution boundary is now adapter-based:

- `shadow` mode routes approved actions into the shadow commerce harness
- `live` mode currently supports a first Shopify store adapter for `adjust_price`
- unsupported live actions fail explicitly instead of silently falling back to fake execution

## Setup

Install dependencies:

```bash
npm install
```

Bootstrap local env vars if you want to pin a model gateway:

```bash
cp .env.example .env
```

Run the CLI:

```bash
npm run dev
```

Optional build and typecheck commands:

```bash
npm run build
npm run typecheck
```

## Model And Provider Setup

The CLI uses `pi`-based agent runtime support. It can work with a provider configured through `pi` auth, or through explicit env vars in this repo.

Required when you want to force a specific provider/model from the shell:

- `KOSBLING_MODEL_PROVIDER`
- `KOSBLING_MODEL_ID`

Optional runtime API key override:

- `KOSBLING_MODEL_API_KEY`
- `KOSBLING_MODEL_BASE_URL` for Anthropic/OpenAI/Google-compatible gateways or proxies

Optional grounding defaults:

- `KOSBLING_LOCALE` defaults to `en-US`
- `KOSBLING_DEFAULT_GEO` defaults to `US`
- `KOSBLING_ENABLE_GOOGLE_TRENDS` defaults to `false`; enable it only as best-effort enrichment
- `KOSBLING_EXECUTION_MODE` defaults to `shadow` and may be set to `live` when a real adapter is configured
- `BRAVE_WEBSEARCH_API_KEY` is the primary real grounding source in the current v0.1 build

Shopify live adapter env vars:

- `KOSBLING_SHOPIFY_STORE_DOMAIN`
- `KOSBLING_SHOPIFY_ACCESS_TOKEN`
- `KOSBLING_SHOPIFY_API_VERSION` defaults to `2025-10`
- `KOSBLING_SHOPIFY_PRODUCT_ID`
- `KOSBLING_SHOPIFY_VARIANT_ID`
- `KOSBLING_SHOPIFY_INVENTORY_ITEM_ID` optional, reserved for later inventory adapter work
- `KOSBLING_SHOPIFY_LOCATION_ID` optional, reserved for later inventory adapter work

CLI localization:

- `KOSBLING_LOCALE=zh-CN` gives Chinese CLI prompts and artifact labels
- `KOSBLING_LOCALE=en-US` gives English CLI prompts and artifact labels
- command words accept both English and Chinese aliases such as `start` / `开始`, `continue` / `继续`, `pause` / `暂停`

Example:

```bash
export KOSBLING_MODEL_PROVIDER=anthropic
export KOSBLING_MODEL_ID=claude-sonnet-4-20250514
export KOSBLING_MODEL_BASE_URL=https://your-gateway.example.com
export ANTHROPIC_API_KEY=your_key_here
export BRAVE_WEBSEARCH_API_KEY=your_brave_key_here
export KOSBLING_ENABLE_GOOGLE_TRENDS=false
export KOSBLING_EXECUTION_MODE=live
export KOSBLING_SHOPIFY_STORE_DOMAIN=example.myshopify.com
export KOSBLING_SHOPIFY_ACCESS_TOKEN=shpat_xxx
export KOSBLING_SHOPIFY_PRODUCT_ID=gid://shopify/Product/123
export KOSBLING_SHOPIFY_VARIANT_ID=gid://shopify/ProductVariant/456
```

If you do not set the `KOSBLING_*` vars, the app will still try to use whatever tool-capable model is available through `pi` auth/model discovery.

Grounding note:

- current recommended path: Brave-backed grounding
- Google Trends is no longer treated as a required hard anchor in the runtime because anonymous access is unstable and often returns `429`
- if you explicitly set `KOSBLING_ENABLE_GOOGLE_TRENDS=true`, the app will try Trends as optional enrichment and fall back to Brave-only grounding when it is rate-limited

## Start A New Run

Launch the CLI with:

```bash
npm run dev
```

Then:

1. Enter your product/business idea.
2. Answer any clarification question from Kos if needed.
3. Review the generated market snapshot.
4. Type a natural-language adjustment or `start` to continue into the next chunk.

Each run advances in 5-day chunks until day 30 completes.

## Pause And Resume

You can pause a run from the prompt by typing:

```text
pause
```

The run state is saved under `runs/<run-id>/`.

Resume a paused run with:

```bash
npm run dev -- --resume <run-id>
```

Example:

```bash
npm run dev -- --resume run-2026-03-23T12-00-00-000Z
```

## Outputs

Each run writes its state and artifacts into `runs/<run-id>/`, including:

- `scenario.json`
- `grounding.json`
- `state.json`
- `chunks.json`
- `market-snapshot.md`
- `chunk-XX.md`
- `chunk-XX-team-trace.md`
- `final-battle-report.md`

## Reference Docs

Repository docs are still the best place to understand the architecture and the intended product shape:

- [`design/sim2real-functional-design.md`](./design/sim2real-functional-design.md)
- [`design/web-observatory-design.md`](./design/web-observatory-design.md)
- [`implementation/v0.1-development-status-2026-03-24.md`](./implementation/v0.1-development-status-2026-03-24.md)
- [`implementation/v0.2-implementation-brief.md`](./implementation/v0.2-implementation-brief.md)
- [`implementation/web-ui-v0.1-brief.md`](./implementation/web-ui-v0.1-brief.md)
- [`references/runtime-loop.md`](./references/runtime-loop.md)
- [`references/state-model.md`](./references/state-model.md)
- [`references/action-spec.md`](./references/action-spec.md)
- [`references/event-spec.md`](./references/event-spec.md)
- [`references/artifact-contract.md`](./references/artifact-contract.md)
