# Agent Compliance Framework — User Guide

A full-stack application for evaluating **AI agent sessions** against **configurable compliance policies**. It’s designed for teams who want to:

- Detect unsafe or non-compliant agent behavior (tool use, workflows, content).
- Monitor drift across variants/“behavior patterns”.
- Track review status (open issues vs resolved).
- Iterate quickly on policies without rewriting agent code.

This guide is based on the repository’s current frontend + backend behavior, including how data is stored and how policies are evaluated.

---

## Table of Contents

1. [Product Overview](#product-overview)
2. [Key Concepts](#key-concepts)
3. [Getting Started](#getting-started)
4. [Agents](#agents)
5. [Sessions](#sessions)
6. [Policies](#policies)
7. [Processing & Jobs](#processing--jobs)
8. [Issues & Review](#issues--review)
9. [Dashboard & Analytics](#dashboard--analytics)
10. [Agent Variants & Tool Flows](#agent-variants--tool-flows)
11. [Best Practices](#best-practices)
12. [Troubleshooting](#troubleshooting)
13. [Appendix: Data & API Notes](#appendix-data--api-notes)

---

## Product Overview

### What the product does

1. **Discovers agents and sessions from files** in `agent_data/` (no upload step required).
2. Lets you **define policies** per agent.
3. **Evaluates sessions** against enabled policies (single-session or batch).
4. Provides **review workflows**: violations, compliance summaries, and “resolved” status.
5. Surfaces **observability signals**: tool usage, session activity heatmaps, and variant patterns.

### Why it’s valuable

- **Policy-driven controls**: enforce guardrails without changing agent code.
- **Auditability**: keep evidence (which check triggered, where, and why).
- **Scalability**: run evaluations in background jobs and track progress.
- **Vendor-agnostic**: supports both OpenAI-style and Anthropic-style tool-result formats.
- **Actionable review**: triage by severity, policy, session cohorts, and “resolved” state.

---

## Key Concepts

### Agent
An “agent” is a named workspace containing sessions and metadata. Each agent is a subdirectory under `agent_data/`:

`agent_data/<agent_id>/`

Agent metadata (optional) lives in:

`agent_data/<agent_id>/.agent_metadata.json`

### Session (also called “Memory” in code)
A single agent run stored as a JSON file:

`agent_data/<agent_id>/<session_id>.json`

Sessions can include a top-level `metadata` block and a `messages` list.

### Policy
Policies are evaluated per agent. The current evaluation engine supports **composite policies** (see [Policies](#policies)).

### Check
An atomic rule evaluated against a session’s messages (e.g., “tool X was called”, “response contains keywords”, “LLM validates tool response field”).

### Violation logic
How multiple checks combine into a pass/fail decision (e.g., “If any trigger happens, all requirements must pass”).

### Processing status
On the Sessions page each session shows:

- **Unprocessed**: evaluated against zero policies
- **Needs Re-processing**: policy set changed since last evaluation (stale/partial)
- **Processed**: evaluated against all enabled policies and up to date

### Compliance status
On the Issues page, each session is categorized as:

- **Compliant**: all evaluations passed
- **Issues**: at least one policy failed
- **Resolved**: marked resolved in the UI (for workflow tracking)

---

## Getting Started

### Prerequisites
- Docker + Docker Compose
- Optional (only for LLM-based checks): API key(s) configured in `backend/.env`

### Run the app

```bash
docker-compose up --build
```

- Frontend: `http://localhost:3000`
- Backend API: `http://localhost:8000`
- OpenAPI docs: `http://localhost:8000/docs`

### First-time workflow (recommended)

1. **Open the UI** and select an agent (or create one in Design mode).
2. **Add sessions** by placing JSON files into `agent_data/<agent_id>/`.
3. Create one or two **starter policies**.
4. Go to **Sessions** and click **Process All Pending**.
5. Use **Dashboard** + **Issues** to review results and iterate.

---

## Agents

### Discovering agents
Agents are discovered from directories under `agent_data/`. The agent list shows:

- Agent name (derived from directory name)
- Agent ID (directory name)
- Session count (number of `.json` files excluding `.agent_metadata.json`)

### Design vs Observability mode
At the top of the agent list:

- **Observability**: view and analyze
- **Design**: create agents, generate sessions, delete agents

### Create a new agent (Design mode)
In Design mode, click **Create New Agent** and provide:

- Agent name + description
- Optional required tools (comma-separated)
- Optional business identifiers
- Optional “generate suggested policies”
- LLM provider and model for generation

This creates:
- `agent_data/<agent_id>/` directory
- `agent_data/<agent_id>/.agent_metadata.json` file (tools, use case, identifiers, LLM config)
- Optional starter policies in the database

### Generate sessions (Design mode)
In Design mode, you can submit a background job to generate simulated sessions for an agent (LLM-driven).

Generated sessions are written into `agent_data/<agent_id>/` and appear in the Sessions list once created.

### Delete an agent (Design mode)
Deleting an agent permanently removes:

- All policies and evaluations for that agent (SQLite DB)
- All derived variant patterns and transitions
- All session files in `agent_data/<agent_id>/`

---

## Sessions

### Where sessions come from
Sessions are loaded from the filesystem (not uploaded). Add files like:

- `agent_data/order_to_invoice/00001__employee_id_EMP123456__account_id_ACCT654321__customer_not_found_error.json`

The UI will show them under that agent’s **Sessions** page.

### Session JSON format

Supported top-level formats:

1) Object with `messages` (and optional `metadata`):

```json
{
  "metadata": {
    "session_id": "10001",
    "timestamp": "2026-01-01T17:00:00Z",
    "duration_seconds": 42.0,
    "user_id": "user_123",
    "business_identifiers": {
      "customer_id": "CID54321"
    },
    "tags": ["production", "edge-case"],
    "custom": { "channel": "web" }
  },
  "messages": []
}
```

2) A raw list of messages (metadata not available in this format):

```json
[
  { "role": "user", "content": "..." },
  { "role": "assistant", "content": "..." }
]
```

### Tool calls and tool results
Tool-call and tool-response checks depend on messages containing tool blocks. Both formats are supported:

- OpenAI-style tool results: `role: "tool"` with `type: "tool_result"`
- Anthropic-style tool results: `role: "user"` with `type: "tool_result"`

See `docs/MESSAGE_FORMAT_SUPPORT.md` for examples and details.

### Session metadata (recommended)
To unlock richer analytics and faster review:

- Set `metadata.timestamp` to populate the activity heatmap
- Use `metadata.business_identifiers` for “More Info” review context
- Use consistent `metadata.tags` for cohorting (if you later extend filters)

### View session details
From **Sessions**, click a session to view the raw transcript.

### Reset evaluations
On **Sessions**, **Reset All Evaluations** deletes stored evaluations for that agent, forcing a clean re-run.

---

## Policies

Policies are managed per agent on the **Policies** page. The current evaluator supports **composite policies**, built from:

- **Checks** (atomic tests)
- **Violation logic** (how checks combine)

### Policy lifecycle

1. Create a policy (enabled by default).
2. Evaluate it:
   - by processing sessions, or
   - across all sessions (background job from Policies page).
3. When you edit a policy, existing evaluations become stale; sessions show **Needs Re-processing** until re-run.

### Severity
Policies have a severity label used for triage:

- `error`, `warning`, `info`

Severity influences the Issues page status badge when a session fails policies.

---

## Composite Policies (No-Code Builder)

The UI includes a no-code builder for composite policies. A composite policy has:

- **Name** and **description**
- A list of **checks**
- A **violation logic** strategy (how to interpret the checks)

If you want a deeper UI walkthrough, also see `docs/NO_CODE_POLICY_BUILDER.md`.

---

## Check Types Reference (8 types)

Each check is evaluated against the session transcript (`messages`). Checks can also include a custom `violation_message` template, with placeholders like `${params.total}`.

### 1) Tool Call (`tool_call`)
Detects a tool call by name, optionally filtered by input parameter conditions.

Config fields:
- `tool_name` (required)
- `params` (optional): `{ "field": { "gt": 1000 } }` etc.

Supported operators for params: `gt`, `gte`, `lt`, `lte`, `eq`, `ne`.

### 2) Tool Response (`tool_response`)
Validates tool results for a specific tool by reading tool-result messages.

Config fields:
- `tool_name` (required)
- `expect_success` (default `true`)
- `response_params` (optional): match values in the parsed tool result JSON

This check recognizes both OpenAI and Anthropic tool-result message formats.

### 3) LLM Tool Response (`llm_tool_response`)
Uses an LLM to validate a single tool response field semantically (e.g., “approval status means approved”).

Config fields:
- `tool_name` (required)
- `parameter` (required)
- `validation_prompt` (required)
- `llm_provider` (`anthropic` or `openai`)
- `model`

Requires API keys; see `docs/SETUP_API_KEYS.md`.

### 4) Response Length (`response_length`)
Checks approximate token length of the final assistant message.

Config fields:
- `min_tokens` (optional)
- `max_tokens` (optional)

Token counts are estimated (roughly 1 token ≈ 4 characters).

### 5) Tool Call Count (`tool_call_count`)
Limits how many times a tool is called.

Config fields:
- `tool_name` (required)
- `operator` (`lt`, `lte`, `gt`, `gte`, `eq`)
- `count` (threshold)

### 6) LLM Response Validation (`llm_response_validation`)
Uses an LLM to validate the final assistant response (PII, tone, completeness, etc.).

Config fields:
- `scope` (`final_message` supported)
- `validation_prompt` (required)
- `llm_provider` (`anthropic` or `openai`)
- `model`

Requires API keys; see `docs/SETUP_API_KEYS.md`. For prompt patterns, see `docs/SEMANTIC_VALIDATION_CAPABILITIES.md`.

### 7) Response Contains (`response_contains`)
Keyword-based validation of the final assistant response.

Config fields:
- `scope` (`final_message` supported)
- `keywords` (list)
- `mode`: `all` (must include all), `any` (must include at least one), `none` (must include none)

### 8) Tool Absence (`tool_absence`)
Ensures a tool was not called.

Config fields:
- `tool_name` (required)

---

## Violation Logic Types (5 types)

Violation logic determines whether a policy passes based on check results.

### IF_ANY_THEN_ALL
If **any** trigger passes, then **all** requirements must pass.

Use for: “If high-risk action occurs, required guardrails must be present.”

### IF_ALL_THEN_ALL
If **all** triggers pass, then **all** requirements must pass.

Use for: “If multiple conditions are true, then enforce stricter rules.”

### REQUIRE_ALL
All checks must pass (logical AND).

Use for: “Always enforce these requirements.”

### REQUIRE_ANY
At least one check must pass (logical OR).

Use for: “At least one of these safeguards must exist.”

### FORBID_ALL
None of the “forbidden” checks should pass (a prohibition pattern).

Use for: “Never call tool X”, “Never mention keyword Y”, etc.

---

## Processing & Jobs

### Processing sessions (Sessions page)
On **Sessions**, the main action is to process:

- **Process Selected** (when you select rows), or
- **Process All Pending** (unprocessed or stale sessions)

Processing evaluates sessions against all enabled policies. Progress appears inline as a job status bar.

### Evaluating one policy across all sessions (Policies page)
Each policy has a “play” action to evaluate that policy across all sessions for the agent (background job).

### Background jobs
Batch evaluations run asynchronously, and the UI polls for status.

Job states:
- `pending` → `running` → `completed` / `failed`

If `refresh_variants` is enabled, the system recomputes variants after processing.

---

## Issues & Review

### Issues page: triage and filtering
The **Issues** page is the primary review queue.

You can filter by:
- Overall status: All / Issues / Resolved / Compliant
- A specific policy (and optionally “failed” vs “passed” for that policy)
- A specific set of sessions (URL param `memories=...`, used by Dashboard drill-downs)

### Resolve / Unresolve
Resolving a session marks it as “resolved” (without changing evaluation results). Use this for workflow:

- “Reviewed and accepted”
- “False positive, acknowledged”
- “Fixed upstream, keep record”

You can add resolution notes and a resolver identity.

### Compliance Review page (deep dive)
From Issues, open a session’s **Compliance Review**, which includes:

- **Summary**: policy outcomes and violation explanations
- **Messages**: transcript with per-message violations highlighted
- **Tool Flow**: sequence diagram of tool calls and results
- **More Info**: session metadata, business identifiers, token usage

### Understanding violations
Violations are structured:

- Which checks triggered
- Which checks failed
- A generated summary and message
- Per-message anchors when possible (to highlight where the issue occurs)

LLM-based checks also include usage/cost information when available.

---

## Dashboard & Analytics

The agent dashboard combines compliance status with usage analytics.

### Metrics bar
Shows counts such as:

- Sessions processed
- Policies
- Compliant vs non-compliant
- LLM calls and estimated cost (when LLM checks run)

### Tool usage chart
Built from processed sessions only. Click a bar to jump to Issues filtered to sessions containing that tool usage.

### Activity heatmap
Uses `metadata.timestamp` from processed sessions to build a week grid. Click a cell to jump to Issues filtered to those sessions.

---

## Agent Variants & Tool Flows

### Variants (behavior patterns)
The system can group sessions into “variants” based on tool sequences and patterns, then show:

- Variant name/preview
- Counts and frequency
- Drill-down options

### Variant flow graph
The **Variants Flow** page shows an aggregated tool transition graph:

- Across all patterns (default), or
- Filtered to selected variants

Use this to identify:

- Unexpected branches
- Missing steps (e.g., approval requests absent before invoice creation)
- Divergent workflows across cohorts

---

## Best Practices

### Start with “workflow guardrails”
Early high-value policies tend to be:

- “If tool X happens, ensure approval tool Y happened first” (IF_ANY_THEN_ALL)
- “Never call tool delete_customer” (tool_absence)
- “Don’t request approval more than N times” (tool_call_count)

### Use LLM checks selectively
LLM-based checks are powerful but add cost and latency. Prefer deterministic checks when possible, and reserve LLM checks for semantics:

- Tone/professionalism
- PII detection
- Approval interpretation when responses vary (“go ahead”, “confirmed”, etc.)

### Keep session formats consistent
For tool-response checks:

- Ensure each tool call block has a stable `id`
- Ensure tool results reference that ID via `tool_use_id` (OpenAI or Anthropic format)

### Make metadata do the work
Add `metadata.timestamp` and business identifiers early. It pays off immediately in review speed and analytics.

### Expect iteration
Treat policies like unit tests:

1. Write one policy
2. Run it on a small set of sessions
3. Review false positives/negatives
4. Refine triggers, thresholds, and prompts

---

## Troubleshooting

### “No agents found”
- Ensure you have at least one directory under `agent_data/`
- Each agent directory should contain session `.json` files

### “No sessions found”
- Ensure session files are in `agent_data/<agent_id>/` (not just `sample_memories/`)
- Filenames must end in `.json`

### Sessions show “Needs Re-processing”
- A policy was added/edited since the last evaluation, or you enabled new policies
- Re-run processing from the Sessions page

### LLM checks fail with “API key not configured”
- Add `ANTHROPIC_API_KEY` and/or `OPENAI_API_KEY` in `backend/.env`
- Restart the backend container
- See `docs/SETUP_API_KEYS.md`

### Tool Response / LLM Tool Response checks never match
- Verify tool calls include `type: "tool_use"` blocks with `id` and `name`
- Verify tool results include `type: "tool_result"` and `tool_use_id` matching the call’s `id`
- See `docs/MESSAGE_FORMAT_SUPPORT.md`

---

## Appendix: Data & API Notes

### Where data lives
- Sessions: `agent_data/<agent_id>/*.json`
- Agent metadata: `agent_data/<agent_id>/.agent_metadata.json`
- Database: SQLite (backend stores policies, evaluations, variants, job status, and session resolution)

### Key API routes (for integration/debugging)
- Agents: `GET /api/agents`, `POST /api/agents`, `DELETE /api/agents/{agent_id}`
- Sessions: `GET /api/memories/{agent_id}/`, `GET /api/memories/{agent_id}/{memory_id}`
- Policies: `GET/POST /api/policies/{agent_id}/`
- Compliance summary: `GET /api/compliance/{agent_id}/summary`
- Jobs: `POST /api/jobs/submit`, `GET /api/jobs/{job_id}/status`

