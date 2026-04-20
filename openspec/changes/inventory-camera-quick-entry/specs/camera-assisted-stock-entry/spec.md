## ADDED Requirements

### Requirement: Camera capture entry
The system MUST provide a camera capture step in inventory stock-in so users can take or upload an item photo as input for assisted entry.

#### Scenario: Camera capture succeeds
- **WHEN** a user opens stock-in quick entry and grants camera or file access
- **THEN** the system captures a valid image and moves to recognition processing

#### Scenario: Camera unavailable or denied
- **WHEN** camera capability is unavailable or permission is denied
- **THEN** the system SHALL provide a manual input path without blocking stock-in completion

### Requirement: Recognition-derived draft fields
The system MUST process the captured image and produce a draft containing item content suggestion and quantity suggestion with confidence metadata.

#### Scenario: Recognition returns draft data
- **WHEN** image recognition completes successfully
- **THEN** the system SHALL display suggested item content and quantity plus confidence for user review

#### Scenario: Recognition fails
- **WHEN** recognition times out, errors, or returns unusable output
- **THEN** the system SHALL keep stock-in flow available and prompt the user to enter data manually

### Requirement: User confirmation before save
The system MUST require explicit user confirmation of item content and quantity before persisting any stock-in record generated from camera-assisted entry.

#### Scenario: User edits recognition result
- **WHEN** suggested values are shown
- **THEN** the user SHALL be able to modify both item content and quantity before submission

#### Scenario: Submission uses confirmed values only
- **WHEN** the user submits the stock-in form
- **THEN** the system SHALL save only the user-confirmed values rather than raw recognition output

### Requirement: Traceability metadata
The system MUST persist recognition metadata for camera-assisted records, including image reference and recognition confidence.

#### Scenario: Assisted entry saved successfully
- **WHEN** a camera-assisted stock-in entry is saved
- **THEN** the record SHALL include source image reference and confidence metadata for auditability
