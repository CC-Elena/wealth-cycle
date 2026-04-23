## ADDED Requirements

### Requirement: Account Transfer Tab in RecordSheet
The system SHALL provide a "Transfer" (转账) tab within the `RecordSheet` to facilitate moving funds between two physical accounts.

#### Scenario: User selects the Transfer tab
- **GIVEN** the `RecordSheet` is open
- **WHEN** the user clicks the "Transfer" tab
- **THEN** the category selector is hidden
- **AND** two account selectors ("From Account" and "To Account") become visible

### Requirement: Execute Transfer
The system SHALL execute an atomic transfer between the selected accounts when the user submits the Transfer form.

#### Scenario: Successful transfer execution
- **GIVEN** the user has selected valid "From" and "To" accounts and entered a positive amount
- **WHEN** the user clicks "Complete" on the number keyboard
- **THEN** the system invokes the transfer API
- **AND** the balances of both accounts are updated accordingly
