# Test evidence

Verification date: 28 August 2026

Live URL: https://relay-webmcp.creamy-ibex-1200.chatgpt.site

## Automated

- `npm test`: 24/24 passed.
- `npm run lint`: passed with zero warnings or errors.
- `npm run build`: production build passed for `/` and `/providers/:provider`.
- `npm audit --omit=dev`: zero production vulnerabilities.

Covered rules include the editable draft state, custom move-plan projection into provider accounts, configurable auto-approval thresholds, real provider-tool-driven service mutation, enforced service order, blocked employer preservation, receipt creation, replay safety, denial before preview, denial before approval, visible approval request, guided fallback, and commit after approval.

The Day 1 trust suite additionally covers exact approval-grant scope, changed terms, wrong-provider use, wrong-action use, ten-minute expiry, atomic consumption, WebMCP replay refusal, and grant-to-receipt linkage.

The Day 2 safety suite covers protected-data refusal without mutation, changed/expired/replayed approval rejection, domain-level out-of-order blocking, the twenty-seven-tool surface, and visible WebMCP safety challenge execution and inspection.

## Browser

- Redesigned move-plan workspace loaded successfully with labelled navigation, recognizable service icons, and a clear human-decision column.
- Permissions panel showed allow, ask, and never-change boundaries.
- The primary experience is fully contained: **Start move plan** executes, pauses for approval, commits, and produces receipts without requiring a ChatGPT prompt handoff.
- A custom plan from **7 Horizon Way** to **88 Beacon Street** on **22 September 2026**, with twelve months of forwarding and a £0 threshold, rendered correctly throughout the journey.
- The provider-level integration test invoked seven actual tool definitions to move Civic, Northstar, Postway, and Wavelength to the 75% approval boundary.
- The built-in RELAY runner visibly progressed Civic, Northstar, Clearflow, Postway, and Haven from Ready → Executing → Complete before pausing at 83%.
- Approval modal showed exact £36 → £42 effects, date, contract, single-use scope, and kept the confirmation button disabled until the monthly increase was acknowledged.
- Human confirmation changed the move plan to complete-within-policy.
- Wavelength receipt appeared as the sixth append-only receipt.
- Reloading retained the configured plan, 100% completion, and all six receipts; Clearflow and Haven retained the configured destination.
- Activity trace reflected policy checks, tool calls, tool results, and explicit human approval in real time.
- Reset returned the plan to 0% with zero receipts, ready for a clean showcase rerun.
- Wavelength service page exposed its imperative tool list and declarative `wavelength_confirm_plan` form.
- Desktop (1440 × 900) and mobile (390 × 844) layouts were inspected for hierarchy, readability, clipping, and navigation.
- The full ready → running → approval → committing → complete journey produced no browser console warnings or errors.
- The approval checkpoint displayed the exact provider, action, price, contract, move date, ten-minute lifetime, and one-use rule before the human decision.
- `GRT-WAV-300-0915` was consumed once, permanently closed, and recorded on `RCT-WAV-0915`.
- The production build's **Safety proof** panel was visually inspected with all five challenge cards, stable denial IDs, enforcing rules, and no-provider-change proof.
- All five controlled challenges reached **5 of 5 challenges proven** while the success receipt count remained zero.
- After all five challenges, the normal built-in runner still reached the 83% human gate, accepted the exact single-use approval, and completed all six allowed provider changes.

## Remaining judge-environment check

The ordinary in-app preview does not expose the experimental WebMCP browser API, so the UI correctly reported safe local mode. Before recording the entry, repeat the imperative tool invocations in Chrome 149+ with the WebMCP testing flag or a judge-compatible ChatGPT browser and capture the DevTools WebMCP panel.
