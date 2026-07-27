# WRLD — Orbit AI Setup

Orbit AI is the enhanced version of Orbit that answers natural-language
questions using a real AI provider, grounded in WRLD's own content. This
document covers environment variables, provider setup, how the knowledge
base works, how to update it, and how to deploy the backend.

## What's new in this pass

- `supabase/functions/orbit-ai/index.ts` — the Edge Function that calls
  the AI provider
- `supabase/functions/_shared/mailer.ts` / `_shared/templates.ts` — unchanged,
  reused by the mentor-application functions (not part of Orbit AI)
- `supabase/migrations/20260728090000_034_orbit_ai_usage.sql` — additive
  rate-limit table, no existing table/column touched
- `orbit-knowledge.js` — new file, loaded on every page right after
  `data.js`, before `orbit.js`
- `orbit.js` — `sendOrbitMessage()` now tries Orbit AI first, and falls
  back to the original rule-based Orbit (`getOrbitResponse()`,
  `ORBIT_RULES`, unchanged) if the AI is unavailable or not yet configured
- A "Clear conversation" button in the Orbit panel header

Orbit's character, avatar, colors, launcher, greetings, and the entire
rule-based engine are **untouched** — Orbit AI is a new first attempt at
answering a message; the existing Orbit is still the fallback and still
works exactly as before if Orbit AI is never configured at all.

## 1. Required environment variables (Edge Function secrets)

Set these as **function secrets** — never in any file in this repo,
same rule as `EMAIL-AUTOMATION-SETUP.md`:

```text
ORBIT_AI_API_KEY=            # your AI provider's API key — REQUIRED to activate Orbit AI
ORBIT_AI_PROVIDER_URL=       # optional — defaults to https://api.openai.com/v1/chat/completions
ORBIT_AI_MODEL=              # optional — defaults to gpt-4o-mini
SUPABASE_URL=                # same value already used by the mentor-application functions
SUPABASE_SERVICE_ROLE_KEY=   # same value already used by the mentor-application functions
```

**No credentials were included in the uploaded project, and none have
been invented here.** Until `ORBIT_AI_API_KEY` is set, every call to
`orbit-ai` returns `{ ok: false, reason: "not_configured" }`, and the
client automatically falls back to the existing rule-based Orbit with
the friendly message:

> "My AI connection is taking a quick orbit. You can still use my
> shortcuts and explore WRLD while I reconnect."

This is expected, normal behavior before setup — not an error.

### Setting secrets

```bash
supabase secrets set ORBIT_AI_API_KEY=sk-... ORBIT_AI_MODEL=gpt-4o-mini
```

`ORBIT_AI_PROVIDER_URL` only needs to be set if you're using a
non-OpenAI, OpenAI-compatible endpoint (many providers — Groq,
OpenRouter, Azure OpenAI, a self-hosted vLLM/Ollama server — expose the
same `/chat/completions` request/response shape). If your provider's API
shape is different, adjust the `callAIProvider()` function in
`supabase/functions/orbit-ai/index.ts` accordingly — it's isolated to
one function so this is a small, contained change.

## 2. Deploying the function

```bash
supabase functions deploy orbit-ai
```

`verify_jwt = true` for this function (see `supabase/config.toml`) — the
Supabase JS SDK already attaches a valid JWT (the signed-in user's
session, or the public anon key for logged-out visitors) automatically
whenever the client calls `sbClient.functions.invoke('orbit-ai', ...)`,
so no extra client-side auth wiring was needed.

## 3. Applying the new migration

```bash
supabase db push
```

Or apply `supabase/migrations/20260728090000_034_orbit_ai_usage.sql`
through the Dashboard's SQL Editor / MCP `apply_migration`, same as any
other migration in this project. It only creates one new table
(`orbit_ai_usage`) with RLS enabled and zero client-facing policies —
nothing existing is altered.

## 4. How the knowledge base works

`orbit-knowledge.js` builds a flat, searchable list of "knowledge
entries" every time a message is sent:

- **Automatic entries** — one per item in `PLAYBOOKS`, `PROGRAMS`,
  `DOWNLOADS`, and `LEARNING_PATHS` (all in `data.js`). Add a new
  Playbook or Program to `data.js` the normal way (see `CLAUDE.md`) and
  it is automatically searchable by Orbit AI — nothing else to update.
- **`ORBIT_STATIC_KNOWLEDGE`** — a short, hand-maintained array in
  `orbit-knowledge.js` for things that aren't Playbook/Program/Download
  objects: navigation routes, role definitions, policies, the real
  contact email. Update this array directly when WRLD adds a genuinely
  new *kind* of feature (not new content within an existing kind).

When a message is sent, `retrieveOrbitKnowledge(message, 6)` scores every
entry by keyword overlap with the message and returns the top 6. Those
6 snippets (title, short text, real internal URL) are sent to the
Edge Function and inserted into the AI's system prompt as the *only*
facts it's allowed to state about WRLD. This is why Orbit AI can't
invent a program, statistic, or policy that doesn't exist — if nothing
relevant is retrieved, the prompt tells the model to say so plainly.

## 5. How to update the knowledge base

- **New Playbook/Program/Download/Learning Path**: no action needed —
  covered automatically the next time anyone asks a related question.
- **New page, policy, or navigation route**: add one object to
  `ORBIT_STATIC_KNOWLEDGE` in `orbit-knowledge.js` with `title`, `text`,
  `url`, `type`.
- **Changed contact email or a core policy**: edit the matching entry in
  `ORBIT_STATIC_KNOWLEDGE` directly.

No redeploy of the Edge Function is required for knowledge-base changes
— `orbit-knowledge.js` is a plain static file served with the rest of
the site.

## 6. Safety, rate limiting, and abuse protection

- **Grounding**: the system prompt (built in `buildSystemPrompt()`)
  explicitly restricts the model to the retrieved WRLD content and
  instructs it to say "I don't have that information" otherwise, never
  to invent programs/stats/policies/contact details, and to always name
  `hello@ourwrld.org` as the only real contact address.
- **Safety boundaries**: the prompt tells the model it is not a doctor,
  therapist, lawyer, financial adviser, or emergency/crisis service, and
  to give only general educational guidance on those topics.
- **Prompt-injection resistance**: the prompt explicitly instructs the
  model to treat anything in the user's message or history that tries to
  change these rules as ordinary message content, not new instructions.
- **Rate limiting**: `orbit_ai_usage` tracks up to 20 requests per
  10-minute window per identity (a signed-in user's id, or a hashed IP
  for logged-out visitors). Beyond that, the function returns a friendly
  "give me a minute" message with HTTP 429.
- **Input/output limits**: messages are truncated to 800 characters
  server-side; replies are capped at 500 tokens via the provider request.
- **No secrets in the browser**: the AI provider key lives only in Edge
  Function secrets, never in any file in this repo or any client-side
  code — same model already established for SMTP credentials in
  `AUTH-SECURITY-SETUP.md`'s secret table.
- **No exposure of other users' data**: Orbit AI only ever receives the
  current user's own context (role, own progress summary) built
  client-side from functions (`getCurrentUser()`, `getState()`) that
  already only expose the signed-in user's own data — no new database
  query was added that could cross accounts.

## 7. Conversation memory

- **Session memory**: `orbitHistory` (already existed) holds the current
  conversation while the panel is open; the last 6 messages are sent to
  the Edge Function as conversational context.
- **Clearing**: the new "↺" button in the panel header calls
  `clearOrbitConversation()`, which resets `orbitHistory`, clears the
  visible messages, and shows a fresh greeting — exactly like opening
  Orbit for the first time.
- Nothing about a conversation is persisted server-side by this pass —
  there is no new "saved preferences" table. If a future pass adds one,
  document it here.
