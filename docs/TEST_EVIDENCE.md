# Test evidence

Verification date: 27 August 2026

## Automated

- `npm test`: 7/7 passed.
- `npm run lint`: passed with zero warnings or errors.
- `npm run build`: production build passed for `/` and `/providers/:provider`.

Covered rules include initial approval pause, exact service mutation, blocked employer preservation, receipt creation, replay safety, preview non-mutation, denial before approval, visible approval request, and commit after approval.

## Browser

- Root mission-control route loaded successfully.
- Permissions panel showed allow, ask, and never-change boundaries.
- Approval modal showed exact £36 → £42 effects, date, contract, and single-use scope.
- Human confirmation changed the mission to complete-within-policy.
- Wavelength receipt appeared as the fourth append-only receipt.
- Reset returned the mission to the approval checkpoint.
- Wavelength service page exposed its imperative tool list and declarative `wavelength_confirm_plan` form.
- Desktop (1440 × 900) and narrow responsive layouts were inspected.
- Root and Wavelength pages produced no browser console warnings or errors.

## Remaining judge-environment check

The ordinary in-app preview does not expose the experimental WebMCP browser API, so the UI correctly reported safe local mode. Before recording the entry, repeat the imperative tool invocations in Chrome 149+ with the WebMCP testing flag or a judge-compatible ChatGPT browser and capture the DevTools WebMCP panel.
