# Software Requirements Specification (SRS) and Database Design

## Module 4: Employee Handbook Management

Document Version: 1.0  
Date: 2026-04-17  
Prepared By: Senior Software Architecture Review

---

## 1. Module Name

Employee Handbook Management Module

## 2. Purpose

The Employee Handbook module provides a centralized policy repository where employees can view the latest active HR policies, while HR/Admin users can create, update, version, and archive policies.

The module enforces read-only access for employees and change-authoring access for HR/Admin, maintains version history, and triggers employee notifications whenever handbook content is created or updated.

## 3. Scope

### In Scope

- Policy authoring by HR/Admin (title, description, rich content, version metadata).
- Policy update workflow with version increment and history tracking.
- Employee read-only access to active policies.
- Policy archive workflow (soft removal from employee visibility).
- Version history retrieval for each policy.
- Notification trigger on policy creation and content update.
- Role-segregated UI routes:
  - Employee/All roles: policy viewing
  - HR/Admin: policy editing/creation and archive

### Out of Scope

- External document management integration (SharePoint/Drive).
- Policy acknowledgment with digital signature.
- Automated policy approval chain before publish.
- Multilingual content translation workflow.

## 4. Actors / Users

- Employee: Views active policies and policy details only.
- HR: Creates new policies, edits policy content, archives policies.
- Admin: Same capabilities as HR for governance and continuity.
- System: Maintains policy versions, status filtering, timestamps, and notifications.

## 5. Functional Requirements

### 5.1 Policy Creation

FR1: HR/Admin shall be able to create a new handbook policy with mandatory title and content.

FR2: System shall allow optional policy description.

FR3: System shall accept optional manual version input; if omitted, initial version shall default to 1.0.

FR4: System shall store new policy status as ACTIVE.

FR5: System shall store created_by from authenticated HR/Admin user.

FR6: System shall persist creation and update timestamps automatically.

FR7: On policy creation, system shall create an initial version history record.

FR8: On policy creation, system shall trigger a global notification for employees.

### 5.2 Policy Update and Versioning

FR9: HR/Admin shall be able to update policy title, description, and content.

FR10: System shall increment policy version automatically when content changes.

FR11: Version increment rule shall follow minor-step pattern (example: 1.0 to 1.1).

FR12: HR/Admin may optionally override auto version with manual version value.

FR13: On content update, system shall create a new handbook_versions record.

FR14: On content update, system shall trigger a global notification containing policy title and version.

FR15: Policy response shall include version history sorted by latest updated timestamp first.

### 5.3 Policy Retrieval and Access Control

FR16: Employee and other authorized users shall be able to list only ACTIVE policies from employee-facing API.

FR17: Employee and other authorized users shall be able to view policy details by ID only if policy status is ACTIVE.

FR18: Admin API shall be able to retrieve policy details including archived records.

FR19: System shall return policy metadata: id, title, description, content, documentUrl, version, status, creator, createdAt, updatedAt, and versionHistory.

FR20: Policy editor page shall support rich-text editing and save actions.

### 5.4 Policy Archive

FR21: HR/Admin shall be able to archive a policy by ID.

FR22: Archive action shall set status to ARCHIVED instead of hard delete.

FR23: Archived policies shall be hidden from employee-facing handbook list and detail endpoints.

FR24: Archived policies shall remain in database and admin-accessible endpoints for audit/reference.

### 5.5 UI and Viewing Experience

FR25: Policy viewer shall render rich text content and policy metadata.

FR26: Policy viewer shall provide read-only mode for non-HR/Admin users.

FR27: HR/Admin shall see edit and archive actions in policy view.

FR28: Policy view/editor shall provide zoom/full-view capability for readability.

FR29: Sidebar shall list available policies for navigation.

FR30: HR/Admin shall see Create Policy option in handbook sidebar.

## 6. Business Rules (Very Important)

BR1: Employee read-only rule

- Employees cannot create, edit, or archive policies.
- Employees can access only ACTIVE policies.

BR2: Policy status rule

- Policy status values are ACTIVE and ARCHIVED.
- ACTIVE policies are visible in employee API.
- ARCHIVED policies are excluded from employee API results.

BR3: Version baseline rule

- New policy version defaults to 1.0 when not explicitly provided.

BR4: Version increment rule

- Content change triggers auto increment of minor version.
- If current version is not parseable, fallback appends .1 safely.

BR5: Version history rule

- Every content version must be captured in handbook_versions.
- Initial creation also creates one version history entry.

BR6: Notification rule

- New policy creation generates global notification.
- Content update generates global notification with updated version.

BR7: Audit ownership rule

- created_by and updated_by references must map to valid employee records.
- admin action identity is taken from authenticated user context.

BR8: Archive behavior rule

- Archive is soft-delete only.
- Archived records remain queryable for admin workflows and history integrity.

BR9: Data consistency rule

- Policy main record version must match the latest effective version in version history.

BR10: Content change trigger rule

- Version increment and notification are triggered only when content changes.
- Title/description-only edits do not necessarily increment version unless content differs.

## 7. Workflow / Process Flow

### 7.1 HR/Admin Create Policy Flow

1. HR/Admin opens handbook editor.
2. Enters title, optional description, and rich content.
3. Optionally enters custom initial version.
4. Saves policy.
5. Backend validates HR/Admin identity from token.
6. Backend creates policy with ACTIVE status and version (default 1.0 if missing).
7. Backend creates initial version record in handbook_versions.
8. Backend emits global notification about new policy.
9. Policy appears in employee handbook list.

### 7.2 HR/Admin Update Policy Flow

1. HR/Admin opens existing policy editor.
2. Updates content/title/description.
3. Saves changes.
4. Backend compares existing and incoming content.
5. If content changed:
   - version auto-increments (or uses manual override).
   - new version history record is created.
   - notification is sent.
6. Updated policy and version history are returned in response.

### 7.3 Employee Policy Consumption Flow

1. Employee opens handbook module.
2. System lists ACTIVE policies only.
3. Employee selects a policy from sidebar.
4. Employee views policy content in read-only mode.
5. Employee can use zoom/full-view for readability.

### 7.4 HR/Admin Archive Flow

1. HR/Admin opens policy detail page.
2. Clicks archive action and confirms.
3. Backend updates status to ARCHIVED.
4. Policy disappears from employee list and direct employee view.
5. Admin can still access archived data through admin endpoints.

## 8. UI Description (High-Level)

### 8.1 Handbook Module Shell

- Dedicated handbook layout with module sidebar and content area.
- Sidebar lists policy titles.
- Create Policy button shown only for HR/Admin.

### 8.2 Policy View UI

- Header with title, last updated date, author details, and navigation controls.
- Rich rendered policy body.
- Zoom in/out and full-screen reader mode.
- HR/Admin action buttons: Edit and Archive.

### 8.3 Policy Editor UI

- Rich text editor with formatting toolbar.
- Inputs for title and policy content (description optional).
- Save flow for create/update.
- Full-screen edit mode and zoom controls.

### 8.4 Access Behavior

- Employee/standard users: view-only.
- HR/Admin users: view + create + edit + archive.

## 9. Non-Functional Requirements

### 9.1 Performance

- Policy list API should respond within 1 second for normal dataset sizes.
- Policy detail view should respond within 1 second.
- Policy save/update operation should complete within 2 seconds excluding large network latency.

### 9.2 Security

- JWT authentication required for all handbook APIs.
- Role-based authorization enforced at route and API access layers.
- HR/Admin operations must be restricted from employee users.

### 9.3 Reliability and Integrity

- Version history must be transactionally consistent with policy updates.
- Archive actions must not remove historical versions.
- Notifications should not break policy save transaction behavior.

### 9.4 Scalability

- Schema should support long rich-text policy content (TEXT columns).
- Version table should support many revisions per policy.

### 9.5 Usability

- Policy content must remain legible on desktop and large displays.
- Full-view and zoom controls should support long-document reading.
- Minimal-click navigation from sidebar to policy details.

---

# Database Design (Employee Handbook Module)

## 1. Module-wise Tables

- handbook_policies
- handbook_versions

## 2. Tables and Fields

### 2.1 handbook_policies

| Field Name   | Data Type    | Key                | Description                  |
| ------------ | ------------ | ------------------ | ---------------------------- |
| id           | BIGINT       | PK                 | Policy identifier            |
| title        | VARCHAR(200) |                    | Policy title                 |
| description  | TEXT         |                    | Policy summary/description   |
| content      | TEXT         |                    | Rich-text policy content     |
| document_url | VARCHAR(500) |                    | Document reference URL/value |
| version      | VARCHAR(20)  |                    | Current effective version    |
| status       | VARCHAR(20)  |                    | ACTIVE or ARCHIVED           |
| created_by   | BIGINT       | FK -> employees.id | Creator employee id          |
| created_at   | TIMESTAMP    |                    | Created timestamp            |
| updated_at   | TIMESTAMP    |                    | Last updated timestamp       |

Recommended constraints/indexes:

- INDEX (status)
- INDEX (created_by)
- INDEX (updated_at)
- INDEX (title)

### 2.2 handbook_versions

| Field Name   | Data Type    | Key                        | Description                           |
| ------------ | ------------ | -------------------------- | ------------------------------------- |
| id           | BIGINT       | PK                         | Version history row id                |
| policy_id    | BIGINT       | FK -> handbook_policies.id | Parent policy                         |
| version      | VARCHAR(20)  |                            | Historical version number             |
| content      | TEXT         |                            | Version-specific content snapshot     |
| document_url | VARCHAR(500) |                            | Version-specific document reference   |
| updated_by   | BIGINT       | FK -> employees.id         | Employee who made this version update |
| updated_at   | TIMESTAMP    |                            | Version update timestamp              |

Recommended constraints/indexes:

- INDEX (policy_id)
- INDEX (updated_by)
- INDEX (updated_at)
- INDEX (policy_id, updated_at)

## 3. Relationships

- employees (1) -> (M) handbook_policies via created_by
- handbook_policies (1) -> (M) handbook_versions via policy_id
- employees (1) -> (M) handbook_versions via updated_by

## 4. Structured Relational Mapping

- handbook_policies.created_by references employees.id
- handbook_versions.policy_id references handbook_policies.id
- handbook_versions.updated_by references employees.id

## 5. ER Diagram (dbdiagram.io Format)

```dbml
Table employees {
  id bigint [pk]
  employee_id varchar(50) [unique, not null]
  first_name varchar(50)
  last_name varchar(50)
}

Table handbook_policies {
  id bigint [pk]
  title varchar(200) [not null]
  description text
  content text
  document_url varchar(500)
  version varchar(20) [not null]
  status varchar(20) [not null]
  created_by bigint [not null]
  created_at timestamp
  updated_at timestamp

  indexes {
    (status)
    (created_by)
    (updated_at)
    (title)
  }
}

Table handbook_versions {
  id bigint [pk]
  policy_id bigint [not null]
  version varchar(20) [not null]
  content text
  document_url varchar(500)
  updated_by bigint [not null]
  updated_at timestamp

  indexes {
    (policy_id)
    (updated_by)
    (updated_at)
    (policy_id, updated_at)
  }
}

Ref: handbook_policies.created_by > employees.id
Ref: handbook_versions.policy_id > handbook_policies.id
Ref: handbook_versions.updated_by > employees.id
```

---

## Alignment Notes (Code vs Requirement)

### Implemented in Code

- Employee handbook viewing APIs expose active policies.
- HR/Admin create/update/archive flows are implemented through admin handbook endpoints.
- Version history is maintained in dedicated handbook_versions table.
- Policy creation and content updates trigger global notifications.
- UI supports policy reading, rich-text editing, archive action, zoom, and full-view.

### Implementation Caveats to Note

- document_url currently uses placeholder values (example: N/A) in create/version save paths.
- Legacy handbook components refer to category-based endpoints that are not part of the active handbook API path used by current routes.
- Backend controller snippets shown do not explicitly include role annotations; access control is currently governed by broader security configuration and frontend route guards.

This handbook module SRS and DB design is structured for final-year project submission and implementation-aligned review.
