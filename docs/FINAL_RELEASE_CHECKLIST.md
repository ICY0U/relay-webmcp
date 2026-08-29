# RELAY final release checklist

Updated: 28 August 2026

## Autonomous verification — passed

- [x] `npm test` — 29/29 tests passed.
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

- [x] Initialize the local Devpost workflow and acknowledge the current official rules.
- [x] Confirm RELAY says **27 tools live** in ChatGPT's WebMCP-capable in-app browser.
- [x] Capture and organize the five screenshots in `artifacts/submission-screenshots/`.
- [x] Record, caption, and review the 2:46 demonstration video.
- [ ] Upload the final video to YouTube and add its publicly viewable URL.
- [ ] Create a public source repository and push the verified commit; the current `sites` remote is a private deployment source, not a public competition repository.
- [x] Make the stable demo URL public and verify an unauthenticated HTTP 200 response.
- [x] Generate the official field-by-field draft in `devpost-submission.md`.
- [ ] Confirm the personal form declarations in the draft.
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

- RELAY does not show **27 tools live** in the final WebMCP evidence.
- The public demo no longer returns an unauthenticated HTTP 200 response.
- The repository link points only to the private Sites source remote.
- The video exceeds the event limit or hides the human approval and refusal proof.
- The recorded source revision differs from the tested and deployed revision.
- Any screenshot contains personal browser data, unrelated tabs, notifications, tokens, or credentials.

## Recommended final sequence

1. Publish the exact verified source revision to a public licensed repository.
2. Upload the verified demonstration master to YouTube.
3. Confirm the personal form declarations and insert the two public URLs.
4. Run the final submit workflow, rehearse once, submit early, and verify the public page.
