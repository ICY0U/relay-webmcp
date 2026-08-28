# RELAY competition sprint status

Updated: 28 August 2026

This file is the recovery point for the three-hour heartbeat. Resume the highest incomplete checkpoint and preserve the last deployed version until the next checkpoint passes.

## Day 1 — Permission model as the star

Status: implementation and local verification complete; checkpoint publishing next.

- Exact single-use approval-grant module added at the domain seam.
- Grant binds provider, action, proposal, plan, price, contract, move date, and postcode.
- Ten-minute expiry, atomic consumption, changed-term rejection, wrong-provider rejection, wrong-action rejection, and replay rejection implemented.
- WebMCP commit tool now requires and verifies the full approved request.
- Live trust chain, approval facts, active grant, consumed grant, permission detail, and receipt proof added to the UI.
- Storage ledger moved to v4 for the new state shape.
- Automated tests: 18 passing.
- Lint and production build: passing.
- Local browser: draft, 83% human gate, exact approval, 100% completion, and consumed-grant proof inspected.

## Next checkpoint — Day 2 safety proof

1. Add a compact judge-facing safety proof mode.
2. Demonstrate forbidden employer or marketing changes rejected before mutation.
3. Demonstrate changed provider terms invalidate approval.
4. Demonstrate expired, replayed, and out-of-order actions safely refused.
5. Add visible refusal receipts without mixing them with completed action receipts.
6. Run the golden path after the safety challenges and deploy.

## Later checkpoints

- Day 3: first-viewport and guided-demo polish, accessibility, then feature freeze.
- Day 4: exact WebMCP judge-browser verification and ten-run reliability pass.
- Day 5: submission copy, screenshots, architecture visual, and under-three-minute video package.
- Day 6: final release verification, rehearsal, early submission, and contingency.
