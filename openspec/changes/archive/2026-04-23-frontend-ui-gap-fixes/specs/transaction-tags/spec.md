## ADDED Requirements

### Requirement: Tag Selection in RecordSheet
The system SHALL display available tags in the `RecordSheet` and allow the user to select multiple tags when recording a transaction.

#### Scenario: User selects tags for an expense
- **GIVEN** the `RecordSheet` is open for an Expense
- **WHEN** the user scrolls to the Tag section
- **THEN** the system displays all active tags as selectable pills
- **AND** the user can toggle multiple tags on or off

### Requirement: Submit Transaction with Tags
The system SHALL include the selected `tagIds` in the payload when submitting the transaction to the backend.

#### Scenario: Transaction submission includes tags
- **GIVEN** the user has selected a category, amount, and two tags
- **WHEN** the user submits the form
- **THEN** the API request includes the `tagIds` array
- **AND** the transaction is correctly associated with the tags in the database
