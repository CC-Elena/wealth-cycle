## Context

The backend and database (`apps/server`) are fully equipped to handle physical accounts (`accounts` table), multidimensional tags (`tags` and `transaction_tags` tables), and diverse transaction types (`income`, `refund` enum values). However, the frontend (`apps/web`) lacks the corresponding UI components to utilize these features. Currently, `RecordSheet.tsx` (the main entry point for transactions) is hardcoded to create `expense` transactions, cannot assign tags, and has no concept of transferring funds between physical accounts. An Account Management UI is missing entirely.

## Goals / Non-Goals

**Goals:**
- Provide a dedicated UI for managing physical accounts (CRUD operations).
- Implement a streamlined UI for inter-account transfers.
- Enhance the quick-entry `RecordSheet` to support assigning tags.
- Enhance the `RecordSheet` to support recording `income` and `refund` types.

**Non-Goals:**
- Modifying the backend database schema (already in place).
- Modifying the AI Agent's intent parsing (Agent already supports these, but this change focuses on manual UI).

## Decisions

1. **Transaction Type Segmented Control**
   - **Decision**: Add a segmented control (Tabs) at the top of `RecordSheet.tsx` to toggle between `Expense` (支出), `Income` (收入), `Transfer` (转账), and `Refund` (退款).
   - **Rationale**: Currently, `type` is hardcoded to `expense`. A tabbed interface at the top is a standard, intuitive pattern for accounting apps, allowing users to switch contexts before entering amounts.

2. **Tag Selector Component**
   - **Decision**: Introduce a `TagSelector` component within `RecordSheet` that renders available tags as selectable pills (multi-select). `financeStore` will be updated to fetch and cache tags on initialization.
   - **Rationale**: Tags are lightweight metadata. A horizontal scrollable list of pills (similar to how categories are currently selected) ensures a frictionless UX.

3. **Dedicated Accounts Page**
   - **Decision**: Create a new route `/accounts` (Accounts.tsx) accessible from the Profile page. This page will list all physical accounts, display their balances, and provide functionality to add or edit accounts.
   - **Rationale**: While `Ledgers` represent logical isolation, `Accounts` represent physical asset locations (Bank, WeChat, Cash). They need a distinct management interface separate from Ledgers.

4. **Transfer Implementation**
   - **Decision**: When the `Transfer` tab is selected in `RecordSheet`, the UI will morph to show "From Account" and "To Account" selectors instead of a category selector. It will invoke the existing `POST /api/accounts/transfer` endpoint.
   - **Rationale**: Reusing `RecordSheet` for transfers centralizes the number pad and input logic, ensuring a consistent user experience.

## Risks / Trade-offs

- **Risk**: Overcomplicating `RecordSheet.tsx`. It already handles splits and regular expenses. Adding tabs and transfers might make the component bloated.
  - **Mitigation**: Extract the core "Amount Display" and "Number Keyboard" into reusable hooks or sub-components. Split the form body into `ExpenseForm`, `TransferForm`, and `IncomeForm` components that are swapped out based on the active tab.
