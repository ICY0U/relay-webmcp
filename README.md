# RELAY

**One intent. Many websites.**

**Live demo:** https://relay-webmcp.creamy-ibex-1200.chatgpt.site

RELAY is a WebMCP-native coordination workspace for safely handling a life event across multiple websites. The user creates one move plan, then RELAY coordinates fictional council, energy, water, postal, home-insurance, broadband, and employer services while keeping every action on one screen.

The agent can inspect accounts, preview changes, and complete low-risk actions within an explicit delegation policy. When Wavelength proposes a £6 monthly increase, RELAY stops at a visible human approval gate. Every completed mutation creates an append-only action receipt.

## Why this needs WebMCP

Ordinary browser automation guesses at pixels and page structure. RELAY instead uses focused, structured tools exposed through `document.modelContext`, plus a declarative semantic form for the final high-risk confirmation. The human and agent share the same live move-plan state and visible UI.

The demo proves seven ideas:

1. **Structured delegation** — allowed fields, forbidden changes, spend boundaries, and expiry are explicit and enforced.
2. **Preview before commit** — risky effects are calculated before any mutation.
3. **Human approval gates** — the agent can open and prepare an approval, but cannot grant it.
4. **Single-use approval grants** — approval is bound to one provider, one action, exact reviewed terms, a ten-minute lifetime, and one use.
5. **Action receipts** — every mutation returns a compact, inspectable audit record, including the grant consumed for a human-approved action.
6. **Visible orchestration** — RELAY contains a complete built-in move coordinator, while real provider-level WebMCP tool calls can also drive the same plan state, activity trace, and receipts.
7. **Executable safety proof** — judges can run five controlled adversarial requests through the real policy seam and inspect refusal records that prove provider state did not change.

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

Open **3-minute guide** at any point for a live four-act walkthrough that follows the current move state and keeps the entire showcase inside RELAY.

1. Configure the current address, destination, move date, forwarding period, and monthly-price approval threshold.
2. Press **Review move plan**, explain the generated instruction and approval rules, then press **Start move plan** without leaving RELAY.
3. Show Civic, Northstar, Clearflow, Postway, and Haven execute in sequence; each action changes the visible plan and creates a receipt.
4. Show RELAY pause at 83% before the Wavelength price increase while Hearth remains blocked.
5. Open **Activity** to show the live structured trace, then **Permissions** to show the precise boundary.
6. Open **Safety proof** and run a changed-terms challenge to show a refusal record without changing a provider or adding a success receipt.
7. Open **Review this decision**, acknowledge the exact £6 monthly increase, and press **Approve once & continue** as the human.
8. Show RELAY commit the narrowly approved transfer, then show completion and all six receipts.
9. Reload the app to prove that the plan and receipts persist, then open Clearflow or Haven to show its account changed to the configured destination.
10. Open Wavelength to show its standalone WebMCP surface and declarative manual-approval form.

## WebMCP surface

| Tool | Kind | Purpose |
| --- | --- | --- |
| `relay_get_move_plan` | Read | Current move plan and approval state |
| `relay_get_permissions` | Read | Exact delegation boundaries |
| `relay_get_service_plan` | Read | Providers, state, and tools |
| `relay_get_safety_proof` | Read | Refusal records from controlled safety challenges |
| `relay_run_safety_challenge` | Safety action | Exercises the real policy seam without mutating provider state |
| `relay_execute_allowed_plan` | Guided fallback | Runs the visible fallback and pauses at the human gate |
| `internet_preview_transfer` | Read/preview | Exact plan and price effects |
| `relay_request_human_approval` | UI handoff | Opens the visible human gate; never approves |
| `internet_commit_transfer` | Mutation | Rejects unless an exact, unexpired, unused approval grant matches every term |
| `relay_list_receipts` | Read | Compact audit timeline |
| `relay_get_receipt` | Read | Full structured receipt |

The move-plan page registers twenty-seven tools, including provider-level account, preview, commit, and safety-evaluation actions whose callbacks update the visible plan state. These provide an additional interface for ChatGPT and other WebMCP agents; the human-facing plan remains fully usable without leaving RELAY. Six fictional provider pages expose their own standalone tool surfaces. Wavelength includes the declarative `wavelength_confirm_plan` form without autosubmit so only a person can submit it.

## Security design

- Read tools are labelled with `readOnlyHint`.
- Input schemas reject unrelated fields and constrain proposal identifiers.
- Preview and commit are separate operations.
- Human approval is single-purpose and replay-safe.
- Approval grants are bound to the provider, mutation, plan, price, contract, move date, and postcode; they expire after ten minutes and are consumed atomically.
- Changed terms, wrong-provider use, wrong-action use, expired grants, and replay are denied before mutation.
- Forbidden employer and marketing changes never receive a tool path.
- Controlled safety challenges reuse the production policy functions and create separate refusal proof with `providerStateChanged: false`.
- Mutations and UI updates share the same domain functions.
- Unsupported browsers fall back to a complete human-driven demo instead of crashing.
- The guided showcase follows the real mission state, can launch the next valid action, and never substitutes scripted success data.
- Drawers have accessible names, Escape closes overlays, and mission progress exposes progressbar semantics.
- All providers, account data, people, addresses, and transactions are fictional.

## Project structure

```text
app/relay-app.tsx                 one-screen move coordination workspace
app/providers/[provider]/         fictional WebMCP service sites
lib/relay.ts                      policy, move-plan state, receipt logic
lib/relay-storage.ts              browser-local fictional service ledger
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
