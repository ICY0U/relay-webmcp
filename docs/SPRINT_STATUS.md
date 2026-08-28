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

Status: complete and deployed as Sites version 10.

- Added a compact judge-facing **Safety proof** panel and navigation badge.
- Added protected-data, changed-terms, expired-grant, replayed-grant, and out-of-order controlled challenges.
- Reused the real approval and service-order domain enforcement instead of a simulated demo-only rules engine.
- Added separate refusal proof with stable denial IDs and `providerStateChanged: false`; success receipts remain untouched.
- Added `relay_get_safety_proof` and `relay_run_safety_challenge`, bringing the move-plan surface to twenty-seven WebMCP tools.
- Storage ledger moved to v5 for refusal records.
- Automated tests: 24 passing; lint and production build passing.
- Production build browser check: five of five challenges proven, zero success receipts, then the complete move path passed through the human gate to 100%.
- Private production deployment succeeded at the stable RELAY live URL and the safety panel was rechecked after publish.

## Next checkpoint — Day 3 showcase polish

1. Tighten first-viewport judge orientation and make the intended three-minute path unmistakable.
2. Add guided demo cues without weakening the one-screen mission-control experience.
3. Complete keyboard, focus, contrast, reduced-motion, and responsive accessibility checks.
4. Capture clean baseline screenshots and freeze product features after verification.

## Later checkpoints

- Day 3: first-viewport and guided-demo polish, accessibility, then feature freeze.
- Day 4: exact WebMCP judge-browser verification and ten-run reliability pass.
- Day 5: submission copy, screenshots, architecture visual, and under-three-minute video package.
- Day 6: final release verification, rehearsal, early submission, and contingency.
