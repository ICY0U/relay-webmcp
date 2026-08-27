# Test evidence

Verification date: 27 August 2026

Live URL: https://relay-webmcp.creamy-ibex-1200.chatgpt.site

## Automated

- `npm test`: 11/11 passed.
- `npm run lint`: passed with zero warnings or errors.
- `npm run build`: production build passed for `/` and `/providers/:provider`.
- `npm audit --omit=dev`: zero production vulnerabilities.

Covered rules include the editable draft state, custom mission projection into provider accounts, configurable auto-approval thresholds, real provider-tool-driven service mutation, enforced service order, blocked employer preservation, receipt creation, replay safety, denial before preview, denial before approval, visible approval request, guided fallback, and commit after approval.

## Browser

- Redesigned root mission-control route loaded successfully with labelled navigation, larger typography, recognizable service icons, and a clear human-decision column.
- Permissions panel showed allow, ask, and never-change boundaries.
- The primary experience is fully contained: **Start secure mission** executes, pauses for approval, commits, and produces receipts without requiring a ChatGPT prompt handoff.
- A custom mission from **7 Horizon Way** to **88 Beacon Street** on **22 September 2026**, with twelve months of forwarding and a £0 threshold, rendered correctly throughout the journey.
- The provider-level integration test invoked seven actual tool definitions to move Civic, Northstar, Postway, and Wavelength to the 75% approval boundary.
- The built-in RELAY runner visibly progressed Civic, Northstar, and Postway from Ready → Executing → Complete before pausing at 75%.
- Approval modal showed exact £36 → £42 effects, date, contract, single-use scope, and kept the confirmation button disabled until the monthly increase was acknowledged.
- Human confirmation changed the mission to complete-within-policy.
- Wavelength receipt appeared as the fourth append-only receipt.
- Reloading retained the configured mission, 100% completion, and all four receipts; Civic then showed **88 Beacon Street** as the persistent registered address.
- Activity trace reflected policy checks, tool calls, tool results, and explicit human approval in real time.
- Reset returned the mission to 0% with zero receipts, ready for a clean showcase rerun.
- Wavelength service page exposed its imperative tool list and declarative `wavelength_confirm_plan` form.
- Desktop (1440 × 900) and mobile (390 × 844) layouts were inspected for hierarchy, readability, clipping, and navigation.
- The full ready → running → approval → committing → complete journey produced no browser console warnings or errors.

## Remaining judge-environment check

The ordinary in-app preview does not expose the experimental WebMCP browser API, so the UI correctly reported safe local mode. Before recording the entry, repeat the imperative tool invocations in Chrome 149+ with the WebMCP testing flag or a judge-compatible ChatGPT browser and capture the DevTools WebMCP panel.
