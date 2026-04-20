## 1. Camera-assisted entry UI

- [ ] 1.1 Add camera/file capture entry point in the inventory stock-in flow.
- [ ] 1.2 Implement preview and retry UX for captured image before recognition.
- [ ] 1.3 Add manual fallback path when camera is unavailable or permission is denied.

## 2. Recognition integration and data flow

- [ ] 2.1 Add recognition service call that submits captured image and receives normalized draft fields.
- [ ] 2.2 Map recognition response into stock-in draft state (`itemNameCandidates`, `quantityGuess`, `confidence`).
- [ ] 2.3 Add timeout/error handling and user-visible failure messaging with manual bypass.

## 3. Confirmation and persistence

- [ ] 3.1 Add confirmation form that allows editing recognized content and quantity before save.
- [ ] 3.2 Ensure save uses only user-confirmed values, not raw recognition output.
- [ ] 3.3 Persist traceability metadata (image reference and confidence) in stock-in record payload.

## 4. Validation and quality checks

- [ ] 4.1 Add unit tests for recognition mapping and failure fallback logic.
- [ ] 4.2 Add integration tests for camera-assisted stock-in happy path and manual fallback path.
- [ ] 4.3 Run lint/build and verify no regression in existing inventory stock-in flow.
