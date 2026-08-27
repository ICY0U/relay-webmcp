# RELAY milestones and test checkpoints

Each milestone is intentionally runnable on its own. Do not move forward if its checkpoint fails.

## Milestone 1 — Mission-control shell

Delivered: responsive one-screen layout, concrete moving-home intent, five service states, a live-run control, and competition-specific visual identity.

Test:

1. Start the app and open the printed local URL.
2. At desktop width, confirm the mission, service plan, and **Run live mission** card are visible together.
3. At phone width, confirm the service cards stack, the approval card remains readable, and the bottom navigation does not hide the page end.

Pass condition: no placeholder content, clipping, horizontal scroll, or console errors.

## Milestone 2 — Permission and approval flow

Delivered: genuinely runnable and fully contained 0% state, sequential service execution, delegation-policy panel, human approval modal, completed-within-policy state, reset path, service details, live activity, and receipt timeline.

Test:

1. Start at 0% with zero receipts, then press **Start secure mission**.
2. Watch each service enter **Executing**, then **Complete**, and verify receipts increment to three.
3. Confirm RELAY pauses at 75% with Wavelength at **Needs approval** and Hearth still blocked.
4. Open **Permissions** and verify employer details and marketing preferences appear under **Never change**.
5. Press **Review this decision**, confirm the exact price, move date, contract, and one-action scope.
6. Acknowledge the £6 monthly increase, then press **Approve once & continue**.
7. Verify the brief committing state, 100% completion, and a fourth Wavelength receipt.
8. Reset the demo and repeat; verify the state returns to 0% with no stale receipts.

Pass condition: approval is explicit, exact, reversible in the demo, and auditable.

## Milestone 3 — WebMCP orchestration

Delivered: nineteen focused tools with JSON schemas, provider-level account/preview/commit actions, read-only hints, structured results, a guided fallback, preview/commit separation, visible approval handoff, sequence enforcement, denial handling, and unsupported-browser fallback.

Test in Chrome 149+ with WebMCP enabled:

1. Open DevTools → Application → WebMCP.
2. Confirm nineteen RELAY and provider tools appear.
3. Invoke `relay_get_permissions` with `{}`.
4. Invoke the Civic, Northstar, and Postway preview/commit pairs in sequence and verify each visible row and receipt updates from the tool call.
5. Invoke `internet_preview_transfer` with `{"moveDate":"2026-09-15","postcode":"SE1 2AB"}` and verify the visible mission pauses at 75% with `approval_required`.
6. Invoke `internet_commit_transfer` before approving and verify `human_approval_required`.
7. Invoke `relay_request_human_approval`, make the decision in the visible UI, then invoke commit again.
8. Inspect `relay_list_receipts` and the visible receipt panel.

Pass condition: provider tool calls—not timers—drive the visible mission, a commit cannot bypass the human gate, and structured tool state matches visible state.

## Milestone 4 — Fictional provider sites

Delivered: branded Civic, Northstar, Postway, and Wavelength pages, provider-owned imperative tools, and Wavelength’s declarative manual-submission form.

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
