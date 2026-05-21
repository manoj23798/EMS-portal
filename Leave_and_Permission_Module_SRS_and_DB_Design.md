# Software Requirements Specification (SRS) and Database Design

## Module 2: Leave & Permission Management

Document Version: 1.0  
Date: 2026-04-17  
Prepared By: Senior Software Architecture Review

---

## 1. Module Name

Leave & Permission Management Module

## 2. Purpose

The Leave & Permission Management module enables employees to request and track leave (vacation) and permission (intra-day absence/delay), ensures compliance with leave entitlement policies based on tenure, automates approval workflows through managers, tracks leave balances with LOP (Loss of Pay) calculation, and integrates with Attendance module to maintain consistent employee attendance records.

This module ensures fair leave distribution, policy enforcement, and seamless leave-to-attendance synchronization.

## 3. Scope

### In Scope

- **Leave Management**: Employee leave request submission (Planned/Urgent), manager approval/rejection, leave balance tracking, LOP calculation.
- **Leave Types**: Pre-configured leave types (Paid, Unpaid, Carry-forward policies), color coding, requirement flags (approval, attachment).
- **Holiday Management**: Admin setup of government and company holidays.
- **Permission Management**: Intra-day permission requests (start/end times), manager approval, integration with attendance.
- **Leave Balance Calculation**: Tenure-based accrual (1 day/month for first 6 months, 1.5 days/month thereafter), yearly reset.
- **Attendance Integration**: Auto-generation of leave/LOP attendance records upon approval.
- **Leave History and Reports**: Employee leave requests, balance snapshots, approval history.
- **Role-based Access**: Employee, Manager, HR/Admin workflows and visibility.

### Out of Scope

- Payroll settlement and salary deduction.
- Third-party holiday calendar integration.
- Biometric or GPS-based permission verification.
- Encashment or leave-as-salary conversion.

## 4. Actors / Users

- **Employee**: Applies leave/permission, views balance, cancels pending/approved leave.
- **Project Manager / Approver**: Reviews and approves/rejects leave requests and permissions.
- **HR/Admin**: Configures leave types, holidays; views all leave/permission records; manages leave policies.
- **System (Backend Scheduler)**: Auto-calculates accrual, applies LOP, syncs with attendance.

## 5. Functional Requirements

### 5.1 Leave Management Functional Requirements

FR1: Employee shall be able to apply for leave by selecting leave type, start/end date, and optional reason.

FR2: System shall validate leave request dates do not overlap with existing approved leave.

FR3: System shall support two leave types: Planned Leave and Urgent Leave.

FR4: For Planned Leave, system shall display warning if requested start date is less than 5 days in advance.

FR5: System shall calculate total leave days as: (end_date - start_date + 1).

FR6: System shall calculate leave allocation (Paid days vs LOP days) based on tenure and monthly accrual rules.

FR7: For employees in first 6 months (Provisional Period): System shall allocate maximum 1 leave day per calendar month, with no carry-forward.

FR8: For employees after 6 months (Permanent Period): System shall allocate 1.5 leave days per calendar month, accumulated within calendar year, reset Jan 1.

FR9: System shall mark excess days beyond monthly/yearly allocation as LOP (Loss of Pay).

FR10: Employee shall be able to view own leave balance (total accrued, used, remaining) for current year.

FR11: System shall populate leave balance based on approved leave requests.

FR12: Manager shall be able to view pending leave requests for team members.

FR13: Manager shall be able to approve leave request with optional remarks.

FR14: Manager shall be able to reject leave request with optional remarks.

FR15: Upon leave approval, system shall create attendance records with status "Leave" (for paid days) or "LOP" (for unpaid days).

FR16: Employee shall be able to cancel own leave if in Pending or Approved status before start date.

FR17: Upon leave cancellation, system shall remove auto-generated leave/LOP attendance records.

FR18: HR/Admin shall be able to view all leave requests across organization.

FR19: HR/Admin shall be able to create, update, delete leave types with custom configurations (color, required approval, carry-forward policy, applicable-after-months).

FR20: System shall support gender-restricted leave types (e.g., maternity leave).

### 5.2 Permission Management Functional Requirements

FR21: Employee shall be able to apply for permission by specifying date, start time, end time, and optional reason.

FR22: System shall validate end time is after start time.

FR23: System shall calculate permission duration in minutes.

FR24: System shall prevent overlapping permission requests on same date/time.

FR25: Manager shall view pending permission requests.

FR26: Manager shall approve permission request.

FR27: Manager shall reject permission request.

FR28: Upon permission approval, system shall update associated attendance record with permission_hours.

FR29: Permission may be considered to override late marking if approved permission covers the delay interval.

FR30: Employee shall view own permission requests and approval status.

FR31: HR/Admin shall view all permission requests.

### 5.3 Holiday Management Functional Requirements

FR32: HR/Admin shall create holidays with name, date, type (Government/Company).

FR33: Holidays shall exclude from leave balance and attendance calculations.

FR34: Employees shall view holiday calendar.

## 6. Business Rules (Very Important)

BR1: **Provisional Period Rule (First 6 Months from Joining)**

- Employee receives 1 leave day per calendar month.
- Monthly quota resets each month (no carry-forward).
- If employee exhausts monthly quota, remaining days are marked LOP.
- Provisional period = joining date + 6 months - 1 day.

BR2: **Permanent Period Rule (After 6 Months from Joining)**

- Employee receives 1.5 leave days per calendar month.
- Annual quota accumulates within calendar year (Jan 1 to Dec 31).
- Unused days at year-end are not carried forward (reset Jan 1).
- Formula: Available days = (1.5 × months elapsed since effective date) - days already approved.

BR3: **Leave Allocation Rule**

- Allocation is calculated at time of approval to reflect current balance state.
- If remaining balance < total requested days, excess days = LOP.
- LOP count is stored and updated at approval time.
- Holidays within leave date range are excluded from consumption calculation.

BR4: **LOP (Loss of Pay) Rule**

- Days marked LOP do not consume paid leave balance.
- LOP attendance records are created with status "LOP".
- LOP calculation is final once leave is approved.

BR5: **Overlapping Leave Prevention Rule**

- System shall prevent overlapping leave requests on same employee.
- Overlapping = any day shared between two date ranges.
- Check applies to Pending and Approved leaves (not Rejected/Canceled).

BR6: **Planned vs unplanned leave Leave Rule**

- Planned Leave: Allows advance planning; frontend shows warning if < 5 days advance notice.
- unplanned (called Unplanned in UI): Emergency absence; no advance notice required.
- Only these two types are allowed for application (admin can create others for future use).

BR7: **Leave Cancellation Rule**

- Employee may cancel leave only if status is Pending or Approved.
- Canceled leaves may be re-applied.
- If Approved leave is canceled, corresponding auto-generated attendance records are removed.
- Manual check-in/check-out records (with in_time set) are not removed.

BR8: **Leave-to-Attendance Sync Rule**

- Upon leave approval, system auto-generates attendance records for each leave day.
- Status = "Leave" for paid days, "LOP" for LOP days.
- Auto-generated records have null in_time and out_time.
- If attendance record already exists (manual check-in), system does not override.

BR9: **Leave Type Configuration Rule**

- Leave types have configurable: name, isPaid flag, totalDays (annual limit, advisory), color, requireApproval, requireAttachment, isCarryForward, monthlyLimit, applicableAfterMonths, genderRestriction.
- applicableAfterMonths: Employee must wait N months from joining before using this leave type.

BR10: **Permission Duration Rule**

- Permission duration = end_time - start_time (in minutes).
- Maximum permission duration is not enforced (policy may limit, but system allows any span).
- Permission hours are stored in minutes and aggregated to attendance.permission_hours.

BR11: **Permission Integration Rule**

- Only Approved permissions affect attendance.permission_hours.
- Permission_hours is used to calculate working hours and may neutralize late marking if approved permission covers the delay.

BR12: **Approval Workflow Rule**

- Employee submits request (status = Pending).
- Manager reviews and either Approves (status = Approved, approvedBy set, remarks optional) or Rejects (status = Rejected, approvedBy set, remarks optional).
- Approval is irreversible; only cancellation (for leave) or deletion (by admin) can undo.

BR13: **Balance Snapshot Rule**

- Leave balance is calculated on-demand based on approval history.
- Balance is not cached indefinitely; caching is optional and for performance.
- Balance = total accrued - total approved (paid days).

BR14: **No Manual Editing Rule**

- Employees have no API to edit or delete own leave/permission records once created.
- Managers cannot edit after approval.
- Only HR/Admin may have override capability (not exposed in current spec).

## 7. Workflow / Process Flow

### 7.1 Leave Request Workflow

1. Employee opens Leave application page.
2. System displays current year leave balance (accrued, used, remaining).
3. Employee selects leave type (Planned/Urgent), start/end date, reason.
4. System validates: dates not in past, end >= start, no overlaps, type allowed.
5. System calculates provisional allocation (Paid vs LOP days) and displays warning if LOP present.
6. For Planned Leave < 5 days advance, system shows warning.
7. Employee submits request.
8. System creates LeaveRequest with status = Pending.
9. Manager receives notification and views request.
10. Manager reviews and Approves or Rejects with remarks.
11. If Approved:
    - System recalculates allocation to current balance.
    - For each approved paid day, system creates Attendance record (status = "Leave").
    - For each LOP day, system creates Attendance record (status = "LOP").
    - System updates LeaveBalance cache.
12. Employee receives notification and can view updated balance.

### 7.2 Leave Cancellation Workflow

1. Employee views approved leave request.
2. Employee clicks Cancel.
3. System validates status is Pending or Approved.
4. Employee optionally provides cancel reason.
5. System marks request as Canceled.
6. If request was Approved:
   - System queries auto-generated attendance records (in_time = null, status = "Leave"/"LOP").
   - System deletes auto-generated records for leave date range.
   - System recalculates LeaveBalance.
7. Employee balance is restored.

### 7.3 Permission Request Workflow

1. Employee opens Permission application page.
2. Employee selects date, start/end time, reason.
3. System validates: end_time > start_time, date is today or future.
4. System checks for overlapping permissions.
5. Employee submits request.
6. System creates PermissionRequest with status = Pending.
7. Manager receives notification and views request.
8. Manager Approves or Rejects.
9. If Approved:
   - System calculates duration (end_time - start_time in minutes).
   - System queries or creates Attendance record for that date.
   - System increments attendance.permission_hours.
   - Permission hours may adjust late classification at next sync.
10. Employee can view approved permission details.

### 7.4 Holiday and Leave Type Setup (Admin Workflow)

1. HR/Admin opens Leave Type Management.
2. HR/Admin creates leave type with: name, isPaid, color, requireApproval, requireAttachment, isCarryForward, applicableAfterMonths.
3. HR/Admin opens Holiday Management.
4. HR/Admin creates holiday with name, date, type.
5. System validates no duplicate holidays.
6. Holidays are excluded from leave calculations.

## 8. UI Description (High-Level)

### 8.1 Employee Leave Dashboard

- Leave balance card: Total accrued, used, remaining (with visual gauge).
- "Apply Leave" button leading to form.
- Leave history table: Request date, leave type, start/end, status, approver.
- Cancel button for Pending/Approved leaves.
- Tooltips for LOP days and policy details.

### 8.2 Leave Application Form

- Form fields: Leave type dropdown, start/end dates, reason textarea, attachment uploader (optional).
- Real-time validation and warnings (e.g., < 5 days advance notice).
- Live balance display and LOP indication.
- Guidelines for leave policies.

### 8.3 Manager Leave Approval Dashboard

- Pending requests table: Employee name, leave dates, type, reason, status.
- Filter by date range, status.
- Approve/Reject buttons with remarks field.
- Approval history visible.

### 8.4 Permission Application Form

- Date picker, start/end time selectors, reason textarea.
- Validation error messages.
- Submit button with loading state.

### 8.5 Permission History Page

- Table of own permission requests: Date, time, duration, reason, status.
- Filter by date range, status.

### 8.6 Holiday Calendar

- Month/year selector.
- Holiday markers with type indicators.
- Hover tooltip shows holiday name.

## 9. Non-Functional Requirements

### 9.1 Performance

- Leave balance calculation should complete within 1 second for < 1000 approved requests.
- Leave approval should persist within 2 seconds.
- Date overlap check should scale to 10,000 employees.

### 9.2 Security

- JWT authentication for all leave/permission endpoints.
- Role-based authorization: Employee, Manager, Admin roles strictly enforced.
- Employee cannot view/edit other employees' leave unless manager/admin.
- Audit trail for approvals and cancellations.

### 9.3 Scalability

- Support 10,000+ employees without schema redesign.
- Indexed queries on employee_id, date, status for fast filtering.
- Optional caching layer for balance snapshots.

### 9.4 Usability

- Clear distinction between Planned and Urgent leave.
- Prominent warnings for policy violations (e.g., advance notice).
- Accessible color contrast and tooltip explanations.
- Mobile-responsive forms and tables.

---

# Database Design (Leave & Permission Module)

## 1. Module-wise Tables

- leave_types
- leave_requests
- leave_balance
- permission_requests
- holidays

## 2. Tables and Fields

### 2.1 leave_types

| Field Name              | Data Type    | Key | Description                                    |
| ----------------------- | ------------ | --- | ---------------------------------------------- |
| id                      | BIGINT       | PK  | Leave type identifier                          |
| name                    | VARCHAR(100) |     | Leave type name (Planned, Casual, Sick, etc.)  |
| is_paid                 | BOOLEAN      |     | Flag: paid or unpaid leave                     |
| total_days              | INT          |     | Annual limit (advisory, for display)           |
| color                   | VARCHAR(10)  |     | Hex color code for UI display                  |
| require_approval        | BOOLEAN      |     | Whether manager approval required              |
| require_attachment      | BOOLEAN      |     | Whether attachment upload required             |
| is_carry_forward        | BOOLEAN      |     | Whether unused days carry to next year         |
| monthly_limit           | INT          |     | Optional monthly cap                           |
| applicable_after_months | INT          |     | Eligibility waiting period from joining        |
| gender_restriction      | VARCHAR(50)  |     | Optional gender restriction (MALE/FEMALE/etc.) |

Recommended constraints/indexes:

- UNIQUE (name)

### 2.2 leave_requests

| Field Name     | Data Type    | Key                  | Description                        |
| -------------- | ------------ | -------------------- | ---------------------------------- |
| id             | BIGINT       | PK                   | Leave request identifier           |
| employee_id    | BIGINT       | FK -> employees.id   | Employee reference                 |
| leave_type_id  | BIGINT       | FK -> leave_types.id | Leave type reference               |
| start_date     | DATE         |                      | Leave start date                   |
| end_date       | DATE         |                      | Leave end date                     |
| total_days     | DOUBLE       |                      | Total leave days (including LOP)   |
| is_lop         | BOOLEAN      |                      | Flag: request contains LOP days    |
| lop_count      | DOUBLE       |                      | Number of LOP days                 |
| reason         | TEXT         |                      | Reason for leave                   |
| attachment_url | VARCHAR(500) |                      | URL to uploaded file               |
| status         | VARCHAR(20)  |                      | Pending/Approved/Rejected/Canceled |
| approved_by    | BIGINT       | FK -> employees.id   | Approver reference                 |
| remarks        | TEXT         |                      | Approval/rejection remarks         |
| cancel_reason  | TEXT         |                      | Cancellation reason                |
| created_at     | TIMESTAMP    |                      | Request creation timestamp         |
| updated_at     | TIMESTAMP    |                      | Record update timestamp            |

Recommended constraints/indexes:

- INDEX (employee_id, status)
- INDEX (start_date, end_date)
- INDEX (status)

### 2.3 leave_balance

| Field Name       | Data Type   | Key                | Description                             |
| ---------------- | ----------- | ------------------ | --------------------------------------- |
| id               | BIGINT      | PK                 | Balance record identifier               |
| employee_id      | BIGINT      | FK -> employees.id | Employee reference                      |
| leave_type       | VARCHAR(50) |                    | Leave type name (e.g., "Leave Balance") |
| total_leaves     | DOUBLE      |                    | Total accrued days                      |
| used_leaves      | DOUBLE      |                    | Days already consumed                   |
| remaining_leaves | DOUBLE      |                    | Available balance                       |
| year             | INT         |                    | Calendar year                           |

Recommended constraints/indexes:

- UNIQUE (employee_id, leave_type, year)

### 2.4 permission_requests

| Field Name  | Data Type   | Key                | Description                   |
| ----------- | ----------- | ------------------ | ----------------------------- |
| id          | BIGINT      | PK                 | Permission request identifier |
| employee_id | BIGINT      | FK -> employees.id | Employee reference            |
| date        | DATE        |                    | Permission date               |
| start_time  | TIME        |                    | Permission start time         |
| end_time    | TIME        |                    | Permission end time           |
| total_hours | BIGINT      |                    | Duration in minutes           |
| reason      | TEXT        |                    | Permission reason             |
| status      | VARCHAR(20) |                    | Pending/Approved/Rejected     |
| approved_by | BIGINT      | FK -> employees.id | Approver reference            |
| created_at  | TIMESTAMP   |                    | Creation timestamp            |

Recommended constraints/indexes:

- INDEX (employee_id, date)
- INDEX (status)
- CHECK (end_time > start_time)

### 2.5 holidays

| Field Name | Data Type    | Key | Description           |
| ---------- | ------------ | --- | --------------------- |
| id         | BIGINT       | PK  | Holiday identifier    |
| date       | DATE         |     | Holiday date          |
| name       | VARCHAR(100) |     | Holiday name          |
| type       | VARCHAR(50)  |     | GOVERNMENT or COMPANY |
| color      | VARCHAR(10)  |     | Hex color code        |

Recommended constraints/indexes:

- UNIQUE (date)
- INDEX (type)

## 3. Relationships

- employees (1) -> (M) leave_requests
- leave_types (1) -> (M) leave_requests
- employees (1) -> (M) leave_balance
- employees (1) -> (M) permission_requests
- employees (1) -> (M) leave_requests as approved_by (approver)
- employees (1) -> (M) permission_requests as approved_by (approver)

## 4. Structured Relational Mapping

- leave_requests.employee_id references employees.id
- leave_requests.leave_type_id references leave_types.id
- leave_requests.approved_by references employees.id
- leave_balance.employee_id references employees.id
- permission_requests.employee_id references employees.id
- permission_requests.approved_by references employees.id

## 5. ER Diagram (dbdiagram.io Format)

```dbml
Table employees {
  id bigint [pk]
  employee_id varchar(50) [unique, not null]
  first_name varchar(50) [not null]
  last_name varchar(50) [not null]
  joining_date date [not null]
}

Table leave_types {
  id bigint [pk]
  name varchar(100) [unique, not null]
  is_paid boolean
  total_days int
  color varchar(10)
  require_approval boolean
  require_attachment boolean
  is_carry_forward boolean
  monthly_limit int
  applicable_after_months int
  gender_restriction varchar(50)
}

Table leave_requests {
  id bigint [pk]
  employee_id bigint [not null]
  leave_type_id bigint [not null]
  start_date date [not null]
  end_date date [not null]
  total_days double [not null]
  is_lop boolean
  lop_count double
  reason text
  attachment_url varchar(500)
  status varchar(20) [not null]
  approved_by bigint
  remarks text
  cancel_reason text
  created_at timestamp
  updated_at timestamp

  indexes {
    (employee_id, status)
    (start_date, end_date)
  }
}

Table leave_balance {
  id bigint [pk]
  employee_id bigint [not null]
  leave_type varchar(50) [not null]
  total_leaves double
  used_leaves double
  remaining_leaves double
  year int [not null]

  indexes {
    (employee_id, leave_type, year) [unique]
  }
}

Table permission_requests {
  id bigint [pk]
  employee_id bigint [not null]
  date date [not null]
  start_time time [not null]
  end_time time [not null]
  total_hours bigint
  reason text
  status varchar(20) [not null]
  approved_by bigint
  created_at timestamp

  indexes {
    (employee_id, date)
    (status)
  }
}

Table holidays {
  id bigint [pk]
  date date [unique, not null]
  name varchar(100) [not null]
  type varchar(50)
  color varchar(10)

  indexes {
    (type)
  }
}

Ref: leave_requests.employee_id > employees.id
Ref: leave_requests.leave_type_id > leave_types.id
Ref: leave_requests.approved_by > employees.id
Ref: leave_balance.employee_id > employees.id
Ref: permission_requests.employee_id > employees.id
Ref: permission_requests.approved_by > employees.id
```

---

## Alignment Notes (Code vs Requirement)

### Implemented in Code

- Two leave types (Planned/Urgent) with configurable properties.
- Provisional period: 1 day/month for first 6 months, no carry-forward.
- Permanent period: 1.5 days/month after 6 months, annual reset.
- LOP calculation and marking.
- Leave approval workflow with remarks.
- Auto-generated attendance records (Leave/LOP).
- Leave cancellation with attendance cleanup.
- Permission requests with manager approval.
- Permission integration with attendance (permission_hours).
- Holiday calendar setup.
- Leave balance calculation and caching.

### Required by Spec and Enforced

- Overlap prevention for leave requests.
- Planned Leave advance notice warning (< 5 days).
- Leave type applicableAfterMonths eligibility.
- Gender-restricted leave types.
- Leave attachment requirement (form-level, not validated).
- Balance snapshots on-demand.
- No manual editing by employees.

This Leave & Permission module SRS and DB design is structured for final-year project submission and production-grade implementation planning.
