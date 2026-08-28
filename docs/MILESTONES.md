# RELAY milestones and test checkpoints

Each milestone is intentionally runnable on its own. Do not move forward if its checkpoint fails.

## Milestone 1 — Move-plan workspace

Delivered: responsive one-screen layout, concrete moving-home intent, seven service states, a live-run control, and competition-specific visual identity.

Test:

1. Start the app and open the printed local URL.
2. At desktop width, confirm the move summary, connected services, and **Start your move plan** card are visible together.
3. At phone width, confirm the service cards stack, the approval card remains readable, and the bottom navigation does not hide the page end.

Pass condition: no placeholder content, clipping, horizontal scroll, or console errors.

## Milestone 2 — Editable move plan and persistent provider state

Delivered: editable current address, destination, postcode, move date, forwarding period, and monthly-price threshold; a generated move plan; genuinely runnable and fully contained 0% state; sequential service execution; approval-rules panel; human approval modal; completed-within-policy state; persistent fictional provider records; reset path; service details; live activity; and receipt timeline.

Test:

1. Enter a recognizably custom address, postcode, move date, forwarding period, and approval threshold, then press **Review move plan**.
2. Verify the instruction and approval-rule text use those exact values, then press **Start move plan**.
3. Watch Civic, Northstar, Clearflow, Postway, and Haven enter **Executing**, then **Complete**, and verify receipts increment to five.
4. Confirm RELAY pauses at 83% with Wavelength at **Needs approval** and Hearth still blocked.
5. Open **Permissions** and verify employer details and marketing preferences appear under **Never change**.
6. Press **Review this decision**, confirm the exact price, configured move date, contract, and one-action scope.
7. Acknowledge the £6 monthly increase, then press **Approve once & continue**.
8. Verify the brief committing state, 100% completion, and a sixth Wavelength receipt.
9. Reload RELAY, verify the completed plan remains, then open Clearflow and Haven and confirm their addresses equal the custom destination.
10. Reset the demo and verify the state returns to move setup with no stale receipts or provider changes.

Pass condition: configuration is real, approval is explicit and exact, fictional account changes persist across reload, and the full demo remains resettable and auditable.

## Milestone 3 — WebMCP orchestration

Delivered: twenty-seven focused tools with JSON schemas, provider-level account/preview/commit actions, safety-evaluation tools, read-only hints, structured results, a guided fallback, preview/commit separation, visible approval handoff, sequence enforcement, denial handling, and unsupported-browser fallback.

Test in Chrome 149+ with WebMCP enabled:

1. Open DevTools → Application → WebMCP.
2. Confirm twenty-seven RELAY and provider tools appear.
3. Invoke `relay_get_permissions` with `{}`.
4. Invoke the Civic, Northstar, Clearflow, Postway, and Haven preview/commit pairs in sequence and verify each visible row and receipt updates from the tool call.
5. Invoke `internet_preview_transfer` with `{"moveDate":"2026-09-15","postcode":"SE1 2AB"}` and verify the visible plan pauses at 83% with `approval_required`.
6. Invoke `internet_commit_transfer` before approving and verify `human_approval_required`.
7. Invoke `relay_request_human_approval`, make the decision in the visible UI, then invoke commit again.
8. Inspect `relay_list_receipts` and the visible receipt panel.

Pass condition: provider tool calls—not timers—drive the visible plan, a commit cannot bypass the human gate, and structured tool state matches visible state.

## Milestone 4 — Fictional provider sites

Delivered: branded Civic, Northstar, Clearflow, Postway, Haven, and Wavelength pages, provider-owned imperative tools, and Wavelength’s declarative manual-submission form.

Test:

1. Open each service from its RELAY row.
2. Use **Open fictional service site**.
3. Confirm account data, move data, exposed tool names, and the visible state are coherent.
4. On Wavelength, confirm the form has `toolname="wavelength_confirm_plan"` and no `toolautosubmit` attribute.

Pass condition: services remain clearly fictional, independently branded, and semantically operable.

## Milestone 5 — Competition verification

Delivered: automated denial/replay tests, lint, production build, responsive browser run, runtime log check, source license, submission README, and deployment.

Test:

```bash
npm test
npm run lint
npm run build
```

Then run the demo path in both ChatGPT’s in-app browser and WebMCP-enabled Chrome. Record the tool panel and visible approval in the final video.

Pass condition: all commands succeed, no browser console warnings/errors occur, the live URL loads, and the public video is under three minutes.

## Milestone 6 — Exact human delegation grants

Delivered: a judge-visible trust chain and a real single-use approval grant tied to Wavelength, `internet_commit_transfer`, Fibre 300, £42/month, a 12-month contract, the configured move date and postcode, a ten-minute expiry, and one permitted use. The consumed grant is preserved on the receipt and in the activity trace.

Test:

1. Reach the Wavelength approval gate and open the human decision.
2. Confirm the provider, action, price, contract, move date, lifetime, and no-reuse rule are visible before approval.
3. Approve and verify `GRT-WAV-300-0915` appears while the commit is pending.
4. Complete the transfer and confirm the grant is marked used once and permanently closed.
5. Attempt changed-price, wrong-provider, wrong-action, expired, and replayed commits through the test suite.

Pass condition: only the exact reviewed action can consume the grant, it can be consumed once, and the UI, tool result, activity trace, and receipt agree.

## Milestone 7 — Live safety proof

Delivered: a judge-facing **Safety proof** panel, five controlled adversarial challenges, refusal records separate from successful action receipts, provider-state invariance, domain-level service-order enforcement, and the `relay_get_safety_proof` and `relay_run_safety_challenge` WebMCP tools.

Test:

1. Open **Safety proof** from a fresh move plan.
2. Run protected-data, changed-terms, expired-grant, replayed-grant, and out-of-order challenges.
3. Confirm every card shows a stable denial ID, the enforcing rule, and **Blocked · no provider change**.
4. Confirm the Safety proof badge reaches five while the Receipts badge remains zero.
5. Close the panel and run the complete move plan to the human approval gate and 100% completion.
6. Invoke `relay_run_safety_challenge` through WebMCP and inspect the same visible proof with `relay_get_safety_proof`.

Pass condition: all five unsafe requests are rejected by the same domain enforcement used by real commits, no challenge mutates a provider or creates a success receipt, and the normal demo path still completes.

## Milestone 8 — Guided showcase and accessibility

Delivered: a compact **3-minute guide** in the first viewport, a four-act state-aware walkthrough, direct handoffs to the next valid action, an always-available safety-proof handoff, named dialogs, Escape dismissal, and semantic mission progress.

Test:

1. Open **3-minute guide** from a fresh move plan and confirm **Set the boundaries** is the current act.
2. Review the move plan, reopen the guide, and confirm **Watch structured actions** is current with a working **Start coordination** action.
3. At the Wavelength pause, confirm the guide advances to **Make the human decision** and opens the exact approval modal.
4. Complete the move and confirm **Inspect the proof** is current with three of four acts complete.
5. Run one real safety challenge and confirm the guide reaches four of four without adding a success receipt.
6. Press Escape from a guide, safety, permission, receipt, or service drawer and confirm it closes.

Pass condition: the guide always reflects real state, never skips policy enforcement, completes the normal demo path, and supports keyboard dismissal.
