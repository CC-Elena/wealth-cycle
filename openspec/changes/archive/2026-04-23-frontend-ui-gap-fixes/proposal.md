## Why

While the backend infrastructure and database schema for Multi-Account (M9), Tag System (M3-F5), and Refund handling (M3-F1) have been implemented and marked as `done` in the Harness plans, the corresponding frontend UI features are entirely missing or incomplete. This change bridges the gap between the claimed capabilities and the actual user experience, preventing technical debt and ensuring a fully closed-loop financial management system.

## What Changes

- **Accounts Management UI**: Add dedicated pages/components in the frontend to view, create, and manage physical accounts (e.g., Bank, Alipay, Cash).
- **Account Transfer UI**: Add the ability to perform and record atomic funds transfers between physical accounts.
- **Tag Selection UI**: Extend the `RecordSheet` to allow users to assign multi-dimensional tags to transactions.
- **Refund & Income UI**: Extend the `RecordSheet` (which currently hardcodes `expense`) to robustly support `income` and `refund` transaction types.

## Capabilities

### New Capabilities
- `account-management`: Frontend UI for physical account mapping and balance viewing.
- `account-transfer`: Frontend UI for transferring funds between existing accounts.
- `transaction-tags`: Frontend UI integration for applying lightweight dimensional tags to transactions.
- `transaction-extended-types`: Frontend UI support for explicitly recording refunds and generic income.

### Modified Capabilities

## Impact

- **Frontend/Web**: Modification of `RecordSheet.tsx` and creation of new pages/components for account management.
- **Stores**: `financeStore` will require updates to expose account management APIs and handle extended transaction payloads (tags, refunds).
