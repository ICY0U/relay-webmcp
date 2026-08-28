# RELAY competition sprint status

Updated: 28 August 2026

This file is the recovery point for the three-hour heartbeat. Resume the highest incomplete checkpoint and preserve the last deployed version until the next checkpoint passes.

## Day 1 — Permission model as the star

Status: complete and deployed as Sites version 9.

- Exact single-use approval-grant module added at the domain seam.
- Grant binds provider, action, proposal, plan, price, contract, move date, and postcode.
- Ten-minute expiry, atomic consumption, changed-term rejection, wrong-provider rejection, wrong-action rejection, and replay rejection implemented.
- WebMCP commit tool now requires and verifies the full approved request.
- Live trust chain, approval facts, active grant, consumed grant, permission detail, and receipt proof added to the UI.
- Storage ledger moved to v4 for the new state shape.
- Automated tests: 18 passing.
- Lint and production build: passing.
- Local browser: draft, 83% human gate, exact approval, 100% completion, and consumed-grant proof inspected.

## Day 2 — Executable safety proof

Status: complete and deployed.

- Added a compact judge-facing **Safety proof** panel and navigation badge.
- Added protected-data, changed-terms, expired-grant, replayed-grant, and out-of-order controlled challenges.
- Reused the real approval and service-order domain enforcement instead of a simulated demo-only rules engine.
- Added separate refusal proof with stable denial IDs and `providerStateChanged: false`; success receipts remain untouched.
- Added `relay_get_safety_proof` and `relay_run_safety_challenge`, bringing the move-plan surface to twenty-seven WebMCP tools.
- Storage ledger moved to v5 for refusal records.
- Automated tests: 24 passing; lint and production build passing.
- Production build browser check: five of five challenges proven, zero success receipts, then the complete move path passed through the human gate to 100%.
- Private production deployment succeeded at the stable RELAY live URL and the safety panel was rechecked after publish.

## Day 3 — Showcase polish and accessibility

Status: complete; feature freeze begins after this checkpoint is published.

- Added a first-viewport **3-minute guide** with four concise acts and target timings.
- Guide state is derived from the real domain mission state and can launch the next valid human action.
- Added a direct safety-proof handoff so the showcase closes on both successful-action evidence and refusal evidence.
- Added named dialogs, Escape dismissal, semantic progressbar values, and preserved visible focus and reduced-motion handling.
- Added two guide-state tests, bringing the suite to 26 passing tests.
- Production-build browser check covered all guide transitions, the exact human approval, the proof-completion condition, keyboard dismissal, and reset.

## Next checkpoint — Day 4 judge-browser verification

1. Verify all twenty-seven WebMCP tools in an official judge-compatible browser.
2. Run the exact tool-driven golden path and capture structured inputs/results.
3. Exercise changed-term, expiry, replay, forbidden-data, and out-of-order denials through WebMCP.
4. Run ten clean end-to-end rehearsals and record timing, failures, and console output.
5. Freeze implementation unless a reliability or accessibility defect is found.

## Later checkpoints

- Day 3: first-viewport and guided-demo polish, accessibility, then feature freeze.
- Day 4: exact WebMCP judge-browser verification and ten-run reliability pass.
- Day 5: submission copy, screenshots, architecture visual, and under-three-minute video package.
- Day 6: final release verification, rehearsal, early submission, and contingency.
