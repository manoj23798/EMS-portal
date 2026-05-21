# Software Requirements Specification (SRS) and Database Design

## Module 1: Attendance Management

Document Version: 1.0  
Date: 2026-04-17  
Prepared By: Senior Software Architecture Review

## 1. Module Name

Attendance Management Module

## 2. Purpose

The Attendance Management module is designed to capture and monitor daily employee attendance through Timer In and Timer Out operations, enforce punctuality policies, track break durations, integrate approved permission hours, and provide employee/admin attendance visibility with exportable reports.

This module ensures auditable attendance records and reduces manual intervention in daily time tracking.

## 3. Scope

### In Scope

- Employee check-in (Timer In) and check-out (Timer Out).
- Break start/end capture with break-type tracking (Lunch/Tea).
- Late marking based on configured threshold (9:30 AM).
- Permission-aware attendance display (approved permission hours).
- Employee attendance history by date range.
- Admin attendance monitoring (daily and monthly views).
- Attendance export to Excel for date ranges.
- Role-based access and protected attendance APIs.

### Out of Scope

- Payroll processing.
- Shift roster planning engine.
- Biometric device integration.
- Retroactive manual editing by employee.

## 4. Actors / Users

- Employee: Performs Timer In/Out, break actions, views own attendance and history.
- HR/Admin: Views organization attendance, filters by date range, exports reports.
- Project Manager: Indirectly influences late handling via permission approvals in Permission module.
- System (Backend Scheduler/Services): Applies attendance calculations and validations.

## 5. Functional Requirements

FR1: Employee shall be able to perform Timer In once per working day.

FR2: System shall prevent duplicate Timer In for the same employee and date.

FR3: System shall mark attendance status as Present when Timer In time is less than or equal to 9:30 AM.

FR4: System shall mark attendance status as Late when Timer In time is after 9:30 AM.

FR5: Employee shall be able to perform Timer Out only after Timer In is recorded.

FR6: System shall prevent duplicate Timer Out for the same attendance record.

FR7: System shall prevent Timer Out when an active break is open.

FR8: Employee shall be able to start a break only after Timer In and before Timer Out.

FR9: System shall support break types (LUNCH, TEA).

FR10: System shall allow only one active break at a time.

FR11: Employee shall be able to end an active break.

FR12: System shall compute and store break duration in minutes.

FR13: System shall enforce maximum allowed break duration of 60 minutes per day.

FR14: System shall calculate total working minutes as: (out_time - in_time) - break_duration.

FR15: Employee shall be able to view today attendance snapshot including in/out time, break, status, and permission summary.

FR16: Employee shall be able to view attendance history by optional date range.

FR17: Admin/HR shall be able to view attendance records by specific date and by date range.

FR18: Admin/HR shall be able to export attendance records to Excel for a selected date range.

FR19: Attendance response payload shall include break entries (start/end/type/duration).

FR20: Attendance response payload shall include approved permission entries (from/to/duration) and total permission minutes.

FR21: Employee shall not have any function to manually edit in_time/out_time for recorded attendance.

FR22: System shall block Timer In if previous working-day attendance exists with missing Timer Out (previous day logout condition).

FR23: If Timer In is after 9:30 AM but approved permission covers delayed interval, system shall classify day as Present (or Present with Permission as per policy), else Late.

FR24: Attendance APIs shall be protected by role-based authentication and authorization.

## 6. Business Rules (Very Important)

BR1: Timer In/Timer Out rule.

- One attendance record per employee per date.
- Timer In must happen before Timer Out.
- Timer Out cannot be done if no Timer In exists.

BR2: Late marking rule.

- Late threshold is 9:30 AM.
- Any Timer In after 9:30 AM is Late unless approved permission covers late interval.

BR3: Break tracking rule.

- Breaks are tracked as separate records linked to attendance.
- Only one active break allowed at a time.
- Max counted break duration per day is 60 minutes.
- Break types: Lunch, Tea.

BR4: No manual edit by employee.

- Employee has no attendance edit API.
- Attendance updates occur only through system timer actions and approved workflow integrations.

BR5: Previous day logout condition.

- Employee cannot Timer In today if latest previous attendance has null out_time.
- Employee must close previous day attendance through authorized HR/admin process (or system closure policy).

BR6: Permission integration rule.

- Permission is hour/minute-based and requires manager/HR approval.
- Only approved permissions affect attendance permission minutes.
- Approved permission duration is aggregated in attendance view.
- Permission may neutralize late marking when it covers delayed entry period.

BR7: Calculation rule.

- total_hours = max(0, minutes_between(in_time, out_time) - break_duration).
- break_duration and permission_hours are stored in minutes for consistency.

BR8: Export rule.

- Export file includes employee, date, in/out, break minutes, total minutes, and status.

## 7. Workflow / Process Flow

### 7.1 Employee Daily Attendance Flow

1. Employee logs in and opens Attendance Dashboard.
2. Employee clicks Timer In.
3. System validates:
   - Employee exists and authenticated.
   - No existing attendance for same date.
   - Previous day logout rule passes.
4. System records in_time and derives status (Present/Late) using 9:30 AM threshold and approved-permission logic.
5. Employee may start break with break type.
6. System creates active break entry.
7. Employee ends break.
8. System computes break minutes and updates total break duration (capped at 60 minutes/day).
9. Employee clicks Timer Out.
10. System validates no active break.
11. System stores out_time and computes total_hours.
12. Employee can view updated status and daily summary.

### 7.2 Permission-Attendance Interaction Flow

1. Employee applies permission in Permission Module.
2. Manager/HR approves permission.
3. System stores permission approval and duration.
4. Attendance module retrieves approved permission for employee/date.
5. Attendance response includes permission entries and total permission minutes.
6. Late classification is adjusted when permission coverage meets policy criteria.

### 7.3 Admin Monitoring and Export Flow

1. HR/Admin opens attendance monitoring page.
2. Selects date or date range.
3. System returns filtered attendance list.
4. Admin applies status/search filters.
5. Admin exports attendance report to Excel.

## 8. UI Description (High-Level)

### 8.1 Employee Attendance Dashboard

- Live clock and shift indicators.
- Action buttons: Timer In, Start Break, End Break, Timer Out.
- Break type selector (Lunch/Tea).
- Today summary cards: work duration, break duration, status.
- Attendance table with date, in/out, break, permission, total, status.
- Tooltip details for break segments and permission intervals.

### 8.2 Admin Attendance Dashboard

- Daily and monthly monitoring view switch.
- From/To date filters.
- Search and status filter.
- Summary counters (Present, Late, Absent, Leave).
- Tabular records with employee name and timing details.
- Export to Excel action.

### 8.3 Monthly Attendance Grid

- Employee-wise matrix across month dates.
- Status markers for Present/Late/Absent/Leave/Holiday/Week Off.
- Hover tooltip for in/out details.

## 9. Non-Functional Requirements

### 9.1 Performance

- Timer actions should respond within 2 seconds under normal load.
- Date-range fetch and export should complete within acceptable SLA for up to 10,000 records.
- Monthly grid should render with horizontal virtualization or efficient scrolling for large staff lists.

### 9.2 Security

- JWT-based authentication for all attendance endpoints.
- Role-based authorization for employee/admin operations.
- Auditability through created/updated timestamps.
- Input validation for all request parameters.

### 9.3 Scalability

- Support increasing employee count without schema redesign.
- Use indexed employee/date lookups for high-volume attendance queries.
- Support archival strategy for historical attendance data.

### 9.4 Usability

- One-click timer actions with clear success/error feedback.
- Mobile-friendly and desktop-friendly dashboard layouts.
- Human-readable status labels and duration formatting.
- Accessible, consistent UI labels and color coding.

---

# Database Design (Attendance Module)

## 1. Module-wise Tables (Attendance)

- attendance
- breaks

Related integration table used by attendance logic:

- permission_requests (from Leave & Permission module; read/integrate only)

## 2. Tables and Fields

### 2.1 attendance

| Field Name       | Data Type   | Key                | Description                                   |
| ---------------- | ----------- | ------------------ | --------------------------------------------- |
| id               | BIGINT      | PK                 | Attendance row identifier                     |
| employee_id      | BIGINT      | FK -> employees.id | Employee reference                            |
| date             | DATE        |                    | Attendance date                               |
| in_time          | TIME        |                    | Timer In time                                 |
| out_time         | TIME        |                    | Timer Out time                                |
| total_hours      | BIGINT      |                    | Net working minutes                           |
| break_duration   | BIGINT      |                    | Total break minutes (capped policy)           |
| permission_hours | BIGINT      |                    | Approved permission minutes for date          |
| status           | VARCHAR(20) |                    | Present/Late/Absent/Leave/Half Day/Permission |
| created_at       | TIMESTAMP   |                    | Record creation timestamp                     |
| updated_at       | TIMESTAMP   |                    | Record update timestamp                       |

Recommended constraints/indexes:

- UNIQUE (employee_id, date)
- INDEX (date)
- INDEX (employee_id, date DESC)

### 2.2 breaks

| Field Name    | Data Type   | Key                 | Description                            |
| ------------- | ----------- | ------------------- | -------------------------------------- |
| id            | BIGINT      | PK                  | Break row identifier                   |
| attendance_id | BIGINT      | FK -> attendance.id | Parent attendance                      |
| break_start   | TIME        |                     | Break start time                       |
| break_end     | TIME        |                     | Break end time (nullable while active) |
| duration      | BIGINT      |                     | Break duration in minutes              |
| break_type    | VARCHAR(50) |                     | LUNCH / TEA                            |

Recommended constraints/indexes:

- INDEX (attendance_id)
- CHECK (break_end IS NULL OR break_end >= break_start)

### 2.3 permission_requests (integration reference)

| Field Name  | Data Type   | Key                | Description                   |
| ----------- | ----------- | ------------------ | ----------------------------- |
| id          | BIGINT      | PK                 | Permission request identifier |
| employee_id | BIGINT      | FK -> employees.id | Employee reference            |
| date        | DATE        |                    | Permission date               |
| start_time  | TIME        |                    | Permission start              |
| end_time    | TIME        |                    | Permission end                |
| total_hours | BIGINT      |                    | Permission minutes            |
| reason      | TEXT        |                    | Reason                        |
| status      | VARCHAR(20) |                    | Pending/Approved/Rejected     |
| approved_by | BIGINT      | FK -> employees.id | Approver                      |
| created_at  | TIMESTAMP   |                    | Creation timestamp            |

## 3. Relationships

- employees (1) -> (M) attendance
- attendance (1) -> (M) breaks
- employees (1) -> (M) permission_requests
- employees (1) -> (M) permission_requests as approved_by (approver relation)

## 4. Structured Relational Mapping

- attendance.employee_id references employees.id
- breaks.attendance_id references attendance.id
- permission_requests.employee_id references employees.id
- permission_requests.approved_by references employees.id

## 5. ER Diagram (dbdiagram.io Format)

```dbml
Table employees {
  id bigint [pk]
  employee_id varchar(50) [unique, not null]
  first_name varchar(50) [not null]
  last_name varchar(50) [not null]
  email varchar(100) [unique, not null]
}

Table attendance {
  id bigint [pk]
  employee_id bigint [not null]
  date date [not null]
  in_time time
  out_time time
  total_hours bigint
  break_duration bigint
  permission_hours bigint
  status varchar(20) [not null]
  created_at timestamp
  updated_at timestamp

  indexes {
    (employee_id, date) [unique]
    (date)
    (employee_id, date)
  }
}

Table breaks {
  id bigint [pk]
  attendance_id bigint [not null]
  break_start time [not null]
  break_end time
  duration bigint
  break_type varchar(50)

  indexes {
    (attendance_id)
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

Ref: attendance.employee_id > employees.id
Ref: breaks.attendance_id > attendance.id
Ref: permission_requests.employee_id > employees.id
Ref: permission_requests.approved_by > employees.id
```

---

## Alignment Notes (Code vs Requirement)

- Implemented in code: timer in/out, break tracking, 60-min break cap, no employee manual edit endpoint, date-range export, permission minutes surfaced in attendance response.
- Required by business document and included in this SRS for enforcement: previous day logout blocking and permission-aware late override at timer-in classification.

This attendance module SRS and DB design is structured for final-year project submission and production-grade implementation planning.
