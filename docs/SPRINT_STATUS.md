# RELAY competition sprint status

Updated: 29 August 2026

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

Status: reliability checkpoint passed; later superseded by the successful ChatGPT in-app browser registration check.

- Added a ten-run isolated tool-definition rehearsal: all ten completed with six unique receipts and one consumed grant.
- Ran ten consecutive production-build UI rehearsals: all ten reached the human gate, completed, and reset successfully.
- Browser runtime logs after the rehearsals: zero warnings and zero errors.
- Connected Chrome loaded RELAY successfully with zero warnings or errors but reported **Demo mode** because that profile did not have the optional testing flag.
- The later ChatGPT in-app browser check reported **27 tools live**, satisfying the event's supported-client requirement without changing Chrome settings.
- Feature implementation is frozen unless a reliability or accessibility defect is found.

## Next autonomous checkpoint — Day 5 submission package

Status: complete; the field-by-field draft was added during submission preparation on 29 August 2026.

- Created a 2:55 narration and shot script around the real guided showcase.
- Created a five-frame screenshot plan with exact states, filenames, and proof requirements.
- Created a polished 1600 × 900 architecture visual covering intent, policy, twenty-seven WebMCP tools, the human checkpoint, receipts, and refusal proof.
- Added the architecture visual and evidence links to the repository README.
- Kept the manual Chrome flag check clearly separated from verified autonomous work.
- The official workflow was initialized, the rules were acknowledged, and `devpost-submission.md` now contains the field-by-field draft.

## Next checkpoint — Day 6 release and participant handoff

Status: every safe autonomous release check is complete; participant-controlled publication and submission actions remain.

- Final test, lint, production-build, and production-audit checks passed.
- Tracked-file scan found no secret or credential candidates.
- Confirmed the current Git remote is the private Sites source remote, not a public competition repository.
- Confirmed the stable Sites access policy remains owner-only with no external visitors or groups.
- Created `docs/FINAL_RELEASE_CHECKLIST.md` with verified passes, stop-ship conditions, exact remaining actions, and the recommended release sequence.
- Did not make the source or demo public, change Chrome settings, agree to event terms, upload a video, or submit on the user's behalf.

## Sprint completion boundary

The product build, reliability proof, guided showcase, screenshot set, demonstration master, architecture visual, release audit, and Devpost draft are complete. The remaining work requires participant authority or external publication: choose public Sites access, publish the repository, upload the video to YouTube, confirm personal declarations, and explicitly approve final submission.

## Submission preparation update — 29 August 2026

- Devpost authentication and WebMCP Challenge registration confirmed.
- Official rules acknowledged and local workflow state initialized.
- ChatGPT's in-app browser confirmed **27 tools live**; a Chrome flag change is no longer a required release gate.
- Five final 1600 × 900 gallery screenshots organized in `artifacts/submission-screenshots/`.
- Revised 2:46 narrated demonstration completed and verified.
- Official field-by-field draft created at `devpost-submission.md`.
- Fresh release checks passed: 29 tests, lint, production build, zero production vulnerabilities, and no secret-pattern or `.env` files.
- Public Sites access, licensed GitHub repository, and public YouTube demonstration are complete. The remaining external action is the explicitly authorized final Devpost submission and public-page verification.

## Post-sprint judge-evidence refinement

Status: complete, verified, and privately deployed.

- Replaced generic activity messages with inspectable tool-contract evidence derived from the same domain transitions used by the built-in runner and WebMCP callbacks.
- Each provider preview shows its exact registered tool name and policy-scoped request fields.
- Each provider mutation shows its exact commit tool, completion status, and matching receipt identifier.
- The approval-gated internet commit now records the exact reviewed request, scoped grant identifier, and receipt result as separate evidence.
- Automated tests: 29 passing; lint and production build passing.

## Later checkpoints

- Day 3: first-viewport and guided-demo polish, accessibility, then feature freeze.
- Day 4: exact WebMCP judge-browser verification and ten-run reliability pass.
- Day 5: submission copy, screenshots, architecture visual, and under-three-minute video package.
- Day 6: final release verification, rehearsal, early submission, and contingency.
