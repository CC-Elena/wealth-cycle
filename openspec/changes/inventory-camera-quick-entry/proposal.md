## Why

Current stock-in workflows require manual entry of item name and quantity, which slows down operators and increases input errors. We need a camera-assisted quick entry flow to reduce typing and speed up intake in real inventory scenarios.

## What Changes

- Add a camera capture flow in inventory stock-in to take item photos directly during entry.
- Add image recognition processing that extracts item description candidates and estimated quantity from photos.
- Add a confirmation step where users can edit recognized name and quantity before saving.
- Add error/fallback handling when recognition confidence is low or recognition fails, allowing full manual input.
- Store captured photo references and recognition metadata alongside stock-in records for traceability.

## Capabilities

### New Capabilities
- `camera-assisted-stock-entry`: Capture item photos in stock-in flow and use vision recognition to prefill item content and quantity.

### Modified Capabilities
- None.

## Impact

- Affected frontend pages/components in inventory stock-in workflow.
- Affected inventory state/store logic for draft stock-in entries and confirmation.
- Requires backend/API support (or existing AI gateway integration) for image recognition.
- Introduces camera permission handling and recognition failure UX paths.
