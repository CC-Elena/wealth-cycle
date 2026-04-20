## Context

Inventory intake currently depends on manual text input for item content and quantity. The project already has inventory entry pages and store-based state management, but does not provide camera-first assisted entry. This change introduces a recognition-assisted path using captured item photos, while preserving manual confirmation before persistence.

Constraints:
- Mobile and desktop browsers have different camera capabilities and permission prompts.
- Recognition output may be uncertain and must not bypass user confirmation.
- Existing stock-in flow must remain usable when camera or recognition is unavailable.

## Goals / Non-Goals

**Goals:**
- Enable camera capture during stock-in entry.
- Provide recognition-derived suggestions for item content and quantity.
- Require user confirmation/edit before final save.
- Keep fallback to full manual entry for reliability.
- Capture recognition confidence and source image reference for traceability.

**Non-Goals:**
- Fully autonomous stock-in without user review.
- Building custom CV models in this change.
- Bulk multi-item detection from one photo in v1.

## Decisions

1. Camera-assisted flow is integrated as an optional branch in existing stock-in UI.
   - Rationale: Reuses current inventory workflow and reduces disruption.
   - Alternative: Separate dedicated page; rejected to avoid duplicated form logic.

2. Recognition is asynchronous and returns a normalized payload:
   `{ itemNameCandidates, quantityGuess, confidence, rawLabels }`.
   - Rationale: Keeps UI decoupled from provider-specific response formats.
   - Alternative: Directly binding provider JSON to UI; rejected due to vendor lock-in.

3. Save operation always uses user-confirmed values, not raw recognition output.
   - Rationale: Prevents incorrect inventory records from low-confidence inference.
   - Alternative: Auto-save over confidence threshold; rejected for initial release risk.

4. Failure policy: camera denied / recognition failed falls back to manual form with visible reason.
   - Rationale: Guarantees task completion and better operator trust.
   - Alternative: Hard-block submission until camera succeeds; rejected for operational fragility.

## Risks / Trade-offs

- Mis-recognition of visually similar items -> Mitigation: confidence display + mandatory user edit/confirm.
- Slow recognition response on weak networks -> Mitigation: loading state, timeout, and manual bypass action.
- Browser camera compatibility variance -> Mitigation: capability checks and file-upload fallback path.
- Extra UX complexity in stock-in screen -> Mitigation: progressive disclosure (simple mode first, advanced details collapsed).
