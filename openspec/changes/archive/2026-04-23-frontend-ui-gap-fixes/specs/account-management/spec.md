## ADDED Requirements

### Requirement: Account Management Page
The system SHALL provide a dedicated "Accounts" page in the frontend to list all physical accounts, showing their balances, names, and icons.

#### Scenario: User views the Accounts page
- **GIVEN** the user is logged in
- **WHEN** the user navigates to `/accounts`
- **THEN** the system displays a list of physical accounts with their current balances
- **AND** the system shows the total aggregated balance across all accounts

### Requirement: Create New Account
The system SHALL allow users to create a new physical account via the Accounts page.

#### Scenario: User creates a new bank account
- **GIVEN** the user is on the Accounts page
- **WHEN** the user clicks "Add Account" and submits a valid name and icon
- **THEN** the system creates the new account and updates the list

### Requirement: Edit/Delete Account
The system SHALL allow users to edit account details or delete an account if it has no associated transactions.

#### Scenario: User edits an account name
- **GIVEN** an existing account
- **WHEN** the user modifies its name and saves
- **THEN** the account name is updated in the list and store
