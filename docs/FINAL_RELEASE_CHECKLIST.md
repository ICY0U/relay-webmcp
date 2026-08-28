# RELAY final release checklist

Updated: 28 August 2026

## Autonomous verification — passed

- [x] `npm test` — 27/27 tests passed.
- [x] `npm run lint` — zero warnings and zero errors.
- [x] `npm run build` — production build passed for the move workspace and provider routes.
- [x] `npm audit --omit=dev` — zero production vulnerabilities.
- [x] Tracked-file secret scan — no `.env`, private-key, credential, password, access-token, client-secret, or API-key candidates found.
- [x] Ten isolated tool-driven rehearsals — all completed with six unique receipts and one consumed approval grant.
- [x] Ten consecutive production-build UI rehearsals — all completed and reset cleanly.
- [x] Browser runtime logs — zero warnings and zero errors after the reliability run.
- [x] Human gate, grant consumption, receipts, safety refusals, guide transitions, persistence, and reset paths verified.
- [x] MIT license present.
- [x] Timed demo script, screenshot plan, architecture visual, test evidence, and reliability matrix present.
- [x] Latest committed source pushed to the Sites source repository and deployed to the stable live URL.
- [x] Production Sites access remains owner-only while release assets are unfinished.

## Participant actions — required before final submission

- [ ] Initialize the local Devpost workflow and acknowledge the current official rules.
- [ ] Enable Chrome's **WebMCP for testing** flag, relaunch, and confirm RELAY says **27 tools live**.
- [ ] Capture the five screenshots in `docs/SUBMISSION_ASSET_PLAN.md`.
- [ ] Record, caption, upload, and review the public video using `docs/DEMO_SCRIPT.md`.
- [ ] Create a public source repository and push the verified commit; the current `sites` remote is a private deployment source, not a public competition repository.
- [ ] Decide when to make the stable demo URL public. Its current custom access policy allows only the owner, with no external visitors or groups.
- [ ] Generate the official field-by-field Devpost draft after the local workflow exists.
- [ ] Run the final submit workflow, review every field, give explicit submission confirmation, and verify the public project page.

## Release commands

```bash
npm test
npm run lint
npm run build
npm audit --omit=dev
```

## Stop-ship conditions

Do not submit if any of these are true:

- RELAY shows **Demo mode** in the recording intended to prove WebMCP registration.
- The public demo requires the judge to request access.
- The repository link points only to the private Sites source remote.
- The video exceeds the event limit or hides the human approval and refusal proof.
- The recorded source revision differs from the tested and deployed revision.
- Any screenshot contains personal browser data, unrelated tabs, notifications, tokens, or credentials.

## Recommended final sequence

1. Enable the WebMCP flag and run one official-browser tool check.
2. Capture screenshots and record the video from the same clean release.
3. Publish the exact verified source revision.
4. Make the demo publicly judge-accessible only when the assets are ready.
5. Fill the official draft, rehearse once, submit early, and verify the public page.
