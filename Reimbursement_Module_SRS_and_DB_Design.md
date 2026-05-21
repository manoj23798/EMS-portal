# Software Requirements Specification (SRS) and Database Design

## Module 3: Reimbursement Management

Document Version: 1.0  
Date: 2026-04-17  
Prepared By: Senior Software Architecture Review

---

## 1. Module Name

Reimbursement Management Module

## 2. Purpose

The Reimbursement Management module enables employees to submit travel reimbursement claims with lodging, local food, and other expense details, including advance amount received and bill-image upload with preview support.

The module provides a multi-role workflow centered on Employee and HR Admin. HR Admin reviews all submitted claims, previews bills, approves with approved amount, or sends claim for Recheck with reason. Employees can track submitted claims and final status updates.

## 3. Scope

### In Scope

- Employee reimbursement claim creation and submission.
- Multi-category expense capture in one claim:
  - Lodging
  - Local Food
  - Others
  - Optional additional travel cost lines where needed
- Advance amount capture and payout/return computation.
- Bill image upload and preview for each line item.
- HR Admin review, approval, and recheck flow.
- Employee claim history and detailed claim view.
- HR Admin claims list with employee, project, reason, submission date, total advance, payout amount, and status.
- HR Admin analytics dashboard for claim trends and status visualization.
- Employee visibility of final claim status.

### Out of Scope

- Direct payroll posting and salary disbursement.
- External accounting ERP integration.
- OCR extraction from uploaded receipts.
- Tax-compliance automation beyond stored GST/SGST fields.

## 4. Actors / Users

- Employee: Creates claims, uploads bill images, previews uploaded images, and views claim status/results.
- HR Admin: Views all claims, inspects details and bills, approves with approved amount, or sends for recheck with reason; uses analytics dashboard.
- System: Calculates totals, payout values, status transitions, and dashboard aggregates.

## 5. Functional Requirements

### 5.1 Claim Submission

FR1: Employee shall be able to create a reimbursement claim with travel reason/project, travel start date, travel end date, and advance amount.

FR2: System shall accept category-wise line items in a single claim request for lodging, local food, and others.

FR3: System shall allow optional claim submission even if only one category has entries.

FR4: System shall persist claim status as PENDING at submission time.

FR5: System shall set submission_date automatically to current date at backend submission.

FR6: System shall calculate total_amount_claimed as the sum of all category totals.

FR7: System shall calculate amount_to_return using formula:
amount_to_return = advance_amount - total_amount_claimed.

FR8: System shall store employee reference based on logged-in user context.

FR9: System shall support optional attachment data for each applicable line item (ticket_file/bill_file).

FR10: System shall return a structured response with claim metadata, subtotals, and item lists after creation.

FR11: Employee shall be able to preview uploaded bill images before final submission.

### 5.2 Category Calculation Rules

FR12: Lodging line amount shall be recomputed at backend as:
amount = days _ persons _ rate_per_person.

FR13: Local food line total shall be recomputed at backend as:
total = morning + afternoon + evening + night.

FR14: Other cost line amounts shall be persisted from provided amount.

FR15: Category subtotals shall be calculated in response mapping for display.

### 5.3 Claim Retrieval and Visibility

FR17: Employee shall be able to view own claim list.

FR18: Employee shall be able to view specific claim details by ID.

FR19: HR Admin shall be able to view all submitted claims.

FR20: HR Admin claims list shall include employee, project, reason, submission date, total advance, payout amount, and status.

FR21: HR Admin shall be able to open detailed claim view before decision.

FR22: System shall expose claim status and decision metadata in claim detail response.

### 5.4 Approval and Settlement

FR23: HR Admin shall be able to approve a claim and enter approved amount.

FR24: HR Admin shall be able to send claim for recheck and provide reason.

FR25: System shall maintain exactly three primary statuses: Pending, Approved, Recheck.

FR26: On approval, system shall store approved amount and action metadata.

FR27: On recheck, system shall store recheck reason and action metadata.

FR28: HR Admin shall be able to preview bill images while reviewing claim.

FR29: Employee shall be able to see final claim status and admin remarks/recheck reason.

FR30: Status transition shall be Pending -> Approved or Pending -> Recheck.

### 5.5 Deletion/Cancellation

FR31: Employee/system shall allow claim deletion only when status is PENDING.

FR32: System shall block deletion for non-PENDING claims with validation error.

### 5.6 Analytics and Reporting

FR33: System shall provide dashboard analytics with optional filters: employeeId, project, status, dateFrom, dateTo.

FR34: Analytics shall provide summary metrics including total claims, pending count, approved count, recheck count, and payout totals.

FR35: Analytics shall provide category breakdown across lodging, local food, and others.

FR36: Analytics shall provide monthly and daily trend datasets.

FR37: Analytics shall provide status distribution (count and amount).

FR38: Analytics shall provide recent claim table data for admin decision support.

FR39: Analytics shall provide department-level budget utilization view.

FR40: Analytics shall provide calendar-wise daily claim summaries with per-employee details.

FR41: System shall provide analytics filter lists for employees and projects.

## 6. Business Rules (Very Important)

BR1: Initial status rule

- Every new claim is created with status PENDING.

BR2: Claim ownership rule

- Employee identity is derived from authenticated user context.
- A user submits claims against only their mapped employee record.

BR3: Computed amount integrity rule

- Backend performs hard recalculation for Lodging, Food, and Wages totals regardless of frontend values.
- This prevents manipulation of computed category totals.

BR4: Claim total formula rule

- total_amount_claimed is the arithmetic sum of all category line totals.

BR5: Return/payable interpretation rule

- amount_to_return = advance_amount - total_amount_claimed.
- Positive value indicates employee returns excess advance to company.
- Negative value indicates company owes payout to employee.

BR6: HR Admin decision state rule

- HR Admin decision is valid only when claim status is PENDING.
- Decision sets admin action metadata.

BR7: Approval rule

- On Approved status, approved amount must be captured.
- On Approved status, recheck reason must be empty.

BR8: Recheck rule

- On Recheck status, recheck reason is mandatory.
- On Recheck status, approved amount must be null or 0.

BR9: Deletion safety rule

- Only PENDING claims can be canceled (deleted).
- Deletion of processed claims is blocked.

BR10: Attachment storage rule

- Attachments are stored as text/Base64 content in item tables.
- ticket_available/bill_available flags indicate proof presence intent.

BR11: Role-based access rule

- Employee can create and view own claims only.
- HR Admin can view all claims and perform decisions.
- HR Admin dashboard is restricted to HR Admin role.

BR12: Status model rule

- System exposes three business statuses only: Pending, Approved, Recheck.
- UI and dashboard counts must be consistent with these three statuses.

BR13: Filter behavior rule

- Analytics date filter applies to submission_date.
- Project filter uses reason_for_travel field.

## 7. Workflow / Process Flow

### 7.1 Employee Claim Submission Flow

1. Employee opens reimbursement apply page.
2. Employee enters project/reason, travel start/end dates, and advance amount.
3. Employee adds one or more category rows (tickets/lodging/conveyance/food/others/wages).
4. Employee uploads optional proofs per row.
5. Frontend computes draft summary for user visibility.
6. Employee submits claim.
7. Backend identifies logged-in employee and creates reimbursement_master record.
8. Backend maps all line items into child tables.
9. Backend recalculates lodging/food/wages totals.
10. Backend computes total_amount_claimed and amount_to_return.
11. Backend saves claim with status PENDING and returns full response.

### 7.2 HR Admin Review and Decision Flow

1. HR Admin opens reimbursement claims dashboard.
2. HR Admin filters/searches and opens a specific claim.
3. HR Admin reviews claim detail and category breakdown.
4. HR Admin previews bill images attached to each line item.
5. HR Admin either:

- Approves with approved amount.
- Marks claim as Recheck with reason.

4. Backend validates claim status is PENDING.
5. Backend sets status (Approved/Recheck) and admin action metadata.
6. Updated claim state is visible to employee in claim history.

### 7.3 Employee Cancellation Flow

1. Employee opens own claim detail.
2. If status is PENDING, employee can cancel request.
3. Backend validates status and deletes master record.
4. Cascading child records are removed via orphan/cascade behavior.

### 7.4 Admin Dashboard Analytics Flow

1. HR Admin opens advanced analytics dashboard.
2. System loads summary and filter options (employees/projects).
3. User applies optional filters.
4. Backend computes aggregated metrics and claim tables.
5. Frontend shows trend charts and status distribution for Pending/Approved/Recheck.

## 8. UI Description (High-Level)

### 8.1 Reimbursement Apply UI

- Dynamic multi-section form with lodging, local food, and others categories.
- Row add/remove for each category.
- Attachment upload and preview pane.
- Draft save/reset support (local storage draft behavior).
- Live summary pod with gross total, advance, and payable/return indicators.

### 8.2 Reimbursement History UI

- Employee claim table with search, filters, sorting, pagination.
- Status badges (Pending/Approved/Recheck).
- Export options (Excel/CSV).
- Navigation to claim detail view.

### 8.3 Claim Detail / Review UI

- Section-wise claim breakdown.
- Receipt preview gallery.
- Summary totals and payable amount.
- Role-based action controls:
  - Cancel (if pending).
  - Approve with approved amount for HR Admin.
  - Recheck with reason for HR Admin.

### 8.4 HR Admin Claims Dashboard UI

- List of claims with employee, project, reason, submission date, total advance, payout amount, and status.
- Action panel to view details, preview bills, approve, or mark recheck.

### 8.5 Advanced Analytics UI

- KPI cards for expenditure and status metrics.
- Category and status distribution charts.
- Trend analysis and calendar visualization.
- HR Admin decision monitoring view.
- Export tools and multi-filter controls.

## 9. Non-Functional Requirements

### 9.1 Performance

- Claim submission API should complete within 2 seconds for typical claim payload.
- Pending list retrieval should complete within 2 seconds for moderate dataset.
- Analytics dashboard response should complete within 3 seconds for filtered scope.

### 9.2 Security

- JWT-based authentication on all reimbursement endpoints.
- Role-based authorization enforced for Employee and HR Admin operations.
- User context must prevent cross-employee unauthorized submission ownership.

### 9.3 Data Integrity

- Backend authoritative recalculation for computed categories.
- Referential integrity between master and child item tables.
- Controlled state transitions for HR Admin actions and deletion behavior.

### 9.4 Scalability

- Schema should support high-volume claim line items with indexed foreign keys.
- Analytics queries should remain filterable by employee/status/date/project.

### 9.5 Usability

- Multi-category entry must remain easy to fill and review.
- Receipt previews and sectioned displays should support faster audit decisions.
- Responsive UI behavior for employee and reviewer workflows.

---

# Database Design (Reimbursement Module)

## 1. Module-wise Tables

- reimbursement_master
- reimbursement_ticket
- reimbursement_lodging
- reimbursement_local_conveyance
- reimbursement_food
- reimbursement_others
- reimbursement_wages

## 2. Tables and Fields

### 2.1 reimbursement_master

| Field Name           | Data Type    | Key                | Description                         |
| -------------------- | ------------ | ------------------ | ----------------------------------- |
| id                   | BIGINT       | PK                 | Claim identifier                    |
| employee_id          | BIGINT       | FK -> employees.id | Claim owner                         |
| reason_for_travel    | VARCHAR(255) |                    | Project/reason                      |
| travel_start_date    | VARCHAR(20)  |                    | Start date text                     |
| travel_end_date      | VARCHAR(20)  |                    | End date text                       |
| submission_date      | DATE         |                    | Submission date                     |
| status               | VARCHAR(30)  |                    | Pending/Approved/Recheck            |
| total_amount_claimed | DOUBLE       |                    | Total claimed amount                |
| advance_amount       | DOUBLE       |                    | Advance received                    |
| amount_to_return     | DOUBLE       |                    | advance - total_claimed             |
| approved_amount      | DOUBLE       |                    | Amount approved by HR Admin         |
| recheck_reason       | VARCHAR(500) |                    | Reason when claim is marked Recheck |
| admin_action_date    | DATE         |                    | HR Admin action date                |
| admin_action_by      | VARCHAR(100) |                    | HR Admin username                   |

Recommended constraints/indexes:

- INDEX (employee_id)
- INDEX (status)
- INDEX (submission_date)
- INDEX (employee_id, status)

### 2.2 reimbursement_ticket

| Field Name        | Data Type    | Key                           | Description              |
| ----------------- | ------------ | ----------------------------- | ------------------------ |
| id                | BIGINT       | PK                            | Ticket row id            |
| reimbursement_id  | BIGINT       | FK -> reimbursement_master.id | Parent claim             |
| travel_date       | VARCHAR(20)  |                               | Travel date              |
| travel_from       | VARCHAR(150) |                               | Origin                   |
| travel_to         | VARCHAR(150) |                               | Destination              |
| mode_of_travel    | VARCHAR(50)  |                               | Mode                     |
| amount            | DOUBLE       |                               | Ticket amount            |
| amount_expression | VARCHAR(100) |                               | User expression metadata |
| person            | VARCHAR(100) |                               | Person name              |
| ticket_available  | BOOLEAN      |                               | Proof available flag     |
| ticket_file       | TEXT         |                               | Base64 ticket file       |
| bill_file         | TEXT         |                               | Alternate bill file      |

Recommended constraints/indexes:

- INDEX (reimbursement_id)

### 2.3 reimbursement_lodging

| Field Name       | Data Type    | Key                           | Description       |
| ---------------- | ------------ | ----------------------------- | ----------------- |
| id               | BIGINT       | PK                            | Lodging row id    |
| reimbursement_id | BIGINT       | FK -> reimbursement_master.id | Parent claim      |
| from_date        | VARCHAR(20)  |                               | Stay start        |
| to_date          | VARCHAR(20)  |                               | Stay end          |
| location         | VARCHAR(150) |                               | Place             |
| days             | INT          |                               | Number of days    |
| persons          | INT          |                               | Number of persons |
| rate_per_person  | DOUBLE       |                               | Per-person rate   |
| amount           | DOUBLE       |                               | Calculated amount |
| bill_available   | BOOLEAN      |                               | Bill present flag |
| bill_file        | TEXT         |                               | Bill attachment   |

Recommended constraints/indexes:

- INDEX (reimbursement_id)

### 2.4 reimbursement_local_conveyance

| Field Name       | Data Type    | Key                           | Description         |
| ---------------- | ------------ | ----------------------------- | ------------------- |
| id               | BIGINT       | PK                            | Conveyance row id   |
| reimbursement_id | BIGINT       | FK -> reimbursement_master.id | Parent claim        |
| date             | VARCHAR(20)  |                               | Travel date         |
| location_from    | VARCHAR(150) |                               | From location       |
| location_to      | VARCHAR(150) |                               | To location         |
| mode_of_travel   | VARCHAR(50)  |                               | Mode                |
| amount           | DOUBLE       |                               | Conveyance amount   |
| ticket_available | BOOLEAN      |                               | Ticket present flag |
| ticket_file      | TEXT         |                               | Ticket attachment   |

Recommended constraints/indexes:

- INDEX (reimbursement_id)

### 2.5 reimbursement_food

| Field Name       | Data Type   | Key                           | Description           |
| ---------------- | ----------- | ----------------------------- | --------------------- |
| id               | BIGINT      | PK                            | Food row id           |
| reimbursement_id | BIGINT      | FK -> reimbursement_master.id | Parent claim          |
| date             | VARCHAR(20) |                               | Date                  |
| morning          | DOUBLE      |                               | Morning amount        |
| afternoon        | DOUBLE      |                               | Afternoon amount      |
| evening          | DOUBLE      |                               | Evening amount        |
| night            | DOUBLE      |                               | Night amount          |
| total            | DOUBLE      |                               | Calculated meal total |
| gst              | DOUBLE      |                               | GST                   |
| sgst             | DOUBLE      |                               | SGST                  |
| bill_available   | BOOLEAN     |                               | Bill present flag     |
| bill_file        | TEXT        |                               | Bill attachment       |

Recommended constraints/indexes:

- INDEX (reimbursement_id)

### 2.6 reimbursement_others

| Field Name       | Data Type    | Key                           | Description         |
| ---------------- | ------------ | ----------------------------- | ------------------- |
| id               | BIGINT       | PK                            | Others row id       |
| reimbursement_id | BIGINT       | FK -> reimbursement_master.id | Parent claim        |
| date             | VARCHAR(20)  |                               | Date                |
| description      | VARCHAR(255) |                               | Expense description |
| amount           | DOUBLE       |                               | Amount              |
| bill_available   | BOOLEAN      |                               | Bill present flag   |
| bill_file        | TEXT         |                               | Bill attachment     |

Recommended constraints/indexes:

- INDEX (reimbursement_id)

### 2.7 reimbursement_wages

| Field Name       | Data Type    | Key                           | Description       |
| ---------------- | ------------ | ----------------------------- | ----------------- |
| id               | BIGINT       | PK                            | Wages row id      |
| reimbursement_id | BIGINT       | FK -> reimbursement_master.id | Parent claim      |
| name             | VARCHAR(150) |                               | Staff/worker name |
| from_date        | VARCHAR(20)  |                               | Work start        |
| to_date          | VARCHAR(20)  |                               | Work end          |
| days_worked      | DOUBLE       |                               | Days worked       |
| per_day_salary   | DOUBLE       |                               | Per-day salary    |
| total_amount     | DOUBLE       |                               | Calculated total  |

Recommended constraints/indexes:

- INDEX (reimbursement_id)

## 3. Relationships

- employees (1) -> (M) reimbursement_master
- reimbursement_master (1) -> (M) reimbursement_ticket
- reimbursement_master (1) -> (M) reimbursement_lodging
- reimbursement_master (1) -> (M) reimbursement_local_conveyance
- reimbursement_master (1) -> (M) reimbursement_food
- reimbursement_master (1) -> (M) reimbursement_others
- reimbursement_master (1) -> (M) reimbursement_wages

## 4. Structured Relational Mapping

- reimbursement_master.employee_id references employees.id
- reimbursement_ticket.reimbursement_id references reimbursement_master.id
- reimbursement_lodging.reimbursement_id references reimbursement_master.id
- reimbursement_local_conveyance.reimbursement_id references reimbursement_master.id
- reimbursement_food.reimbursement_id references reimbursement_master.id
- reimbursement_others.reimbursement_id references reimbursement_master.id
- reimbursement_wages.reimbursement_id references reimbursement_master.id

## 5. ER Diagram (dbdiagram.io Format)

```dbml
Table employees {
  id bigint [pk]
  employee_id varchar(50) [unique, not null]
  first_name varchar(50)
  last_name varchar(50)
}

Table reimbursement_master {
  id bigint [pk]
  employee_id bigint [not null]
  reason_for_travel varchar(255)
  travel_start_date varchar(20)
  travel_end_date varchar(20)
  submission_date date
  status varchar(30)
  total_amount_claimed double
  advance_amount double
  amount_to_return double
  approved_amount double
  recheck_reason varchar(500)
  admin_action_date date
  admin_action_by varchar(100)

  indexes {
    (employee_id)
    (status)
    (submission_date)
    (employee_id, status)
  }
}

Table reimbursement_ticket {
  id bigint [pk]
  reimbursement_id bigint [not null]
  travel_date varchar(20)
  travel_from varchar(150)
  travel_to varchar(150)
  mode_of_travel varchar(50)
  amount double
  amount_expression varchar(100)
  person varchar(100)
  ticket_available boolean
  ticket_file text
  bill_file text
}

Table reimbursement_lodging {
  id bigint [pk]
  reimbursement_id bigint [not null]
  from_date varchar(20)
  to_date varchar(20)
  location varchar(150)
  days int
  persons int
  rate_per_person double
  amount double
  bill_available boolean
  bill_file text
}

Table reimbursement_local_conveyance {
  id bigint [pk]
  reimbursement_id bigint [not null]
  date varchar(20)
  location_from varchar(150)
  location_to varchar(150)
  mode_of_travel varchar(50)
  amount double
  ticket_available boolean
  ticket_file text
}

Table reimbursement_food {
  id bigint [pk]
  reimbursement_id bigint [not null]
  date varchar(20)
  morning double
  afternoon double
  evening double
  night double
  total double
  gst double
  sgst double
  bill_available boolean
  bill_file text
}

Table reimbursement_others {
  id bigint [pk]
  reimbursement_id bigint [not null]
  date varchar(20)
  description varchar(255)
  amount double
  bill_available boolean
  bill_file text
}

Table reimbursement_wages {
  id bigint [pk]
  reimbursement_id bigint [not null]
  name varchar(150)
  from_date varchar(20)
  to_date varchar(20)
  days_worked double
  per_day_salary double
  total_amount double
}

Ref: reimbursement_master.employee_id > employees.id
Ref: reimbursement_ticket.reimbursement_id > reimbursement_master.id
Ref: reimbursement_lodging.reimbursement_id > reimbursement_master.id
Ref: reimbursement_local_conveyance.reimbursement_id > reimbursement_master.id
Ref: reimbursement_food.reimbursement_id > reimbursement_master.id
Ref: reimbursement_others.reimbursement_id > reimbursement_master.id
Ref: reimbursement_wages.reimbursement_id > reimbursement_master.id
```

---

## Alignment Notes (Code vs Requirement)

### Implemented in Code

This document section defines the requested target workflow:

- Employee submission with category details, advance amount, bill upload, and preview.
- HR Admin end-to-end review with approve or recheck decision.
- Employee visibility of final status (Pending, Approved, Recheck).
- HR Admin dashboard for data visualization and decision support.

### Implementation Caveats to Note

- Current backend currently contains manager-centric approval plus HR/Admin settlement fields.
- Existing status model in code includes Rejected and legacy status handling in analytics.
- To fully match this requested flow, status model and action APIs should be standardized to Pending/Approved/Recheck and HR Admin final decision ownership.

This reimbursement module SRS and DB design is prepared for final-year project documentation and implementation-aligned review.
