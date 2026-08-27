# RELAY

**One intent. Many websites.**

**Live demo:** https://relay-webmcp.creamy-ibex-1200.chatgpt.site

RELAY is a WebMCP-native mission control for safely delegating a life event across multiple websites. The competition demo turns “I’m moving home” into a coordinated plan across fictional council, energy, postal, broadband, and employer services.

The agent can inspect accounts, preview changes, and complete low-risk actions within an explicit delegation policy. When Wavelength proposes a £6 monthly increase, RELAY stops at a visible human approval gate. Every completed mutation creates an append-only action receipt.

## Why this needs WebMCP

Ordinary browser automation guesses at pixels and page structure. RELAY instead uses focused, structured tools exposed through `document.modelContext`, plus a declarative semantic form for the final high-risk confirmation. The human and agent share the same live mission state and visible UI.

The demo proves five ideas:

1. **Structured delegation** — allowed fields, forbidden changes, spend boundaries, and expiry are explicit and enforced.
2. **Preview before commit** — risky effects are calculated before any mutation.
3. **Human approval gates** — the agent can open and prepare an approval, but cannot grant it.
4. **Action receipts** — every mutation returns a compact, inspectable audit record.
5. **Visible orchestration** — the mission begins at 0%, executes each fictional service in sequence, and keeps the UI, trace, and receipts synchronized.

## Run locally

Requirements: Node.js 22.13 or newer.

```bash
npm install
npm run dev
```

Open the exact local URL printed by the development server. To inspect WebMCP tools, use ChatGPT’s in-app browser or Chrome 149+ with `chrome://flags/#enable-webmcp-testing` enabled.

```bash
npm test
npm run lint
npm run build
```

## Three-minute demo path

1. Open RELAY at 0% and explain the single moving-home intent and active guardrails.
2. Press **Run live mission** and watch Civic, Northstar, and Postway execute and create receipts.
3. Show RELAY pause at 75% before the Wavelength price increase while Hearth remains blocked.
4. Open **Activity** to show the live structured trace, then **Permissions** to show the precise boundary.
5. Open **Review this decision**, acknowledge the exact £6 monthly increase, and press **Approve once & continue** as the human.
6. Show mission completion, the untouched employer service, and all four receipts.
7. In WebMCP-enabled Chrome, demonstrate `relay_execute_allowed_plan` or the preview/denied-commit/approval sequence.
8. Open the Wavelength fictional service to show its imperative tools and declarative manual-approval form.

## WebMCP surface

| Tool | Kind | Purpose |
| --- | --- | --- |
| `relay_get_mission` | Read | Current mission and approval state |
| `relay_get_permissions` | Read | Exact delegation boundaries |
| `relay_get_service_plan` | Read | Providers, state, and tools |
| `relay_execute_allowed_plan` | Mutation/orchestration | Runs allowed actions and pauses at the human gate |
| `internet_preview_transfer` | Read/preview | Exact plan and price effects |
| `relay_request_human_approval` | UI handoff | Opens the visible human gate; never approves |
| `internet_commit_transfer` | Mutation | Rejects unless matching approval exists |
| `relay_list_receipts` | Read | Compact audit timeline |
| `relay_get_receipt` | Read | Full structured receipt |

The four fictional provider pages expose additional single-purpose tools in same-origin descendant frames. Wavelength also exposes the declarative `wavelength_confirm_plan` form without autosubmit so only a person can submit it.

## Security design

- Read tools are labelled with `readOnlyHint`.
- Input schemas reject unrelated fields and constrain proposal identifiers.
- Preview and commit are separate operations.
- Human approval is single-purpose and replay-safe.
- Forbidden employer and marketing changes never receive a tool path.
- Mutations and UI updates share the same domain functions.
- Unsupported browsers fall back to a complete human-driven demo instead of crashing.
- All providers, account data, people, addresses, and transactions are fictional.

## Project structure

```text
app/relay-app.tsx                 one-screen mission control
app/providers/[provider]/         fictional WebMCP service sites
lib/relay.ts                      policy, mission state, receipt logic
lib/relay-tools.ts                testable WebMCP tool definitions
lib/use-webmcp.ts                 browser registration lifecycle
tests/relay.test.ts               permission and tool denial tests
docs/MILESTONES.md                checkpoint-by-checkpoint test guide
docs/TEST_EVIDENCE.md             latest verification record
```

## Competition readiness

The official rules require a live URL, a public licensed source repository, a clear implementation description, and a public YouTube demo under three minutes. Before submission, enable the production WebMCP browser flag, record the golden path plus at least one denial, publish the repository publicly, and freeze/tag the submitted revision.

## License

MIT. See [LICENSE](LICENSE).
