## 1. State Management (financeStore)

- [x] 1.1 Update `financeStore` to fetch and cache Tags from the backend API.
- [x] 1.2 Implement `createAccount`, `updateAccount`, and `deleteAccount` methods in `financeStore`.
- [x] 1.3 Implement `transferAccounts` method in `financeStore` wrapping the `POST /api/accounts/transfer` endpoint.

## 2. Account Management UI

- [x] 2.1 Create `Accounts.tsx` page under `src/pages` to list all physical accounts and their balances.
- [x] 2.2 Implement account creation and editing modal/form within `Accounts.tsx`.
- [x] 2.3 Add navigation link to the new Accounts page in `Profile/index.tsx`.

## 3. RecordSheet Enhancements (Types & Tags)

- [x] 3.1 Refactor `RecordSheet.tsx` to include a top-level Segmented Control (Tabs) for switching between `Expense`, `Income`, `Transfer`, and `Refund`.
- [x] 3.2 Create a `TagSelector` component in `RecordSheet.tsx` to display and multi-select tags.
- [x] 3.3 Update the submission logic in `RecordSheet.tsx` to pass the `type` dynamically based on the active tab, and include `tagIds` array.
- [x] 3.4 Adjust the category list rendering to filter categories correctly based on whether Expense or Income tab is selected.

## 4. Inter-Account Transfer UI

- [x] 4.1 Implement `TransferForm` layout within `RecordSheet.tsx` (shown only when Transfer tab is active) with "From Account" and "To Account" selectors.
- [x] 4.2 Connect the `TransferForm` submission to the newly created `financeStore.transferAccounts` method.
