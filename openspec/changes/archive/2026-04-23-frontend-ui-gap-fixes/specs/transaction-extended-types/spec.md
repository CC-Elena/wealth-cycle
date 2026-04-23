## ADDED Requirements

### Requirement: Extended Transaction Types Tabs
The system SHALL provide tabs in the `RecordSheet` to switch between `Expense` (支出), `Income` (收入), and `Refund` (退款).

#### Scenario: User switches to Income tab
- **GIVEN** the `RecordSheet` is open
- **WHEN** the user selects the "Income" tab
- **THEN** the category list updates to show Income categories
- **AND** the transaction type defaults to `income`

#### Scenario: User switches to Refund tab
- **GIVEN** the `RecordSheet` is open
- **WHEN** the user selects the "Refund" tab
- **THEN** the transaction type defaults to `refund`
- **AND** the UI allows selecting the original expense or inventory item to refund against (if applicable)

### Requirement: Submit Non-Expense Transactions
The system SHALL correctly construct the payload with the appropriate `type` (e.g., `income`, `refund`) based on the active tab.

#### Scenario: Successful Refund submission
- **GIVEN** the user is on the Refund tab and entered an amount
- **WHEN** the user submits the form
- **THEN** the API receives a payload with `type: 'refund'`
- **AND** the transaction is recorded as a refund in the database
