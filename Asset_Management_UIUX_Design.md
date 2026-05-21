# Asset Management System UI/UX Design

## Enterprise Internal Tool Based on Excel Asset Templates

Document Version: 1.0  
Date: 2026-04-21  
Prepared By: Senior Software Architecture Review

---

## 1. Product Goal

Design a complete enterprise-grade Asset Management System that replaces multiple manual Excel sheets with a structured web application while preserving the familiarity of spreadsheet-style operations.

The system must support:

- Individual asset inventory for employees and devices
- Shared/category assets by location and responsibility
- Stock quantity tracking for consumables and spares
- Maintenance and service tracking for scheduled equipment
- Read-only access for HR users
- Full CRUD capability for System Admin users

The experience should feel like "Advanced Excel, but smarter, faster, and safer."

## 2. Design Principles

- Data-first layout over card-first layout
- High density, low clutter
- Excel-like tables with modern controls
- Minimal clicks for frequent actions
- Consistent corporate UI, not consumer SaaS styling
- Sticky headers, strong filters, and predictable row actions
- Read-only safety for HR
- Fast scanning and editing for Admin

## 3. User Roles

### 3.1 System Admin

- Create, edit, delete all records
- Manage assets, assignments, stock, maintenance schedules, and checklist entries
- Access all actions and editing tools

### 3.2 HR User

- View all modules and reports
- Cannot create, edit, or delete data
- Can search, filter, export, and inspect records
- All action buttons hidden in HR mode

## 4. Information Architecture

### Main Navigation

- Assets
  - Laptops
  - Servers
- Category Assets
  - IT Fixtures
  - Air Conditioners
  - Devices
- Stock
  - RAM
  - HDD
  - Drives
  - Wifi Adapters
  - Mobiles
  - GPS Trackers
  - Network Equipment
  - Tools
  - Accessories
- Maintenance
  - Service Schedule
  - Checklist

### Global Page Structure

- Left sidebar navigation
- Top breadcrumb/title bar
- Search and filter row always visible
- Dense table or form as the primary content
- Right-side utility drawer optional for details, filters, or quick actions

## 5. Visual Design System

### 5.1 Colors

- Background: white and soft gray
- Border color: light gray for grid-like separation
- Primary action: corporate blue
- Success: green
- Warning: yellow/amber
- Error: red
- Neutral status: slate gray

### 5.2 Typography

- Readable sans-serif with strong numeric clarity
- Table headers uppercase with modest tracking
- Body text compact but legible
- Slightly larger labels for forms and section headers

### 5.3 Spacing and Layout

- Tight vertical spacing for tables
- Moderate padding for forms and modals
- Sticky headers for long pages
- Minimal shadows, subtle elevation only where needed

### 5.4 Status Badges

- Green: Completed, Working, In Use
- Yellow: Pending, Scheduled, Low Stock
- Red: Issue, Faulty, Repair Needed, Not Working
- Gray: N/A, Not Required, Archived

## 6. Core UX Behavior

- Global search always visible
- Filters persist while navigating within a module
- Sorting on key columns
- Inline editing where frequent
- Bulk actions optional for admin-heavy workflows
- Tables support horizontal scrolling for wide datasets
- Row hover highlight for scanability
- Zebra striping for large tables
- Empty states clearly explain missing data
- Admin actions show confirmation before destructive changes
- HR users see the same data layout without edit controls

---

# Module 1: Asset Inventory

## 7. Purpose

Manage individually assigned assets such as laptops and servers, using a high-density grid similar to an Excel inventory sheet.

## 8. Page Layout

### Top Bar

- Page title: Asset Inventory
- Breadcrumb: Assets > Laptops or Assets > Servers
- Search box
- Filters:
  - Department
  - Status
  - Asset Type
  - Make
- Admin-only button: + Add Asset

### Main Table

The table should be the primary focus and should support horizontal scrolling.

#### Required Columns

- SL No
- Asset Code
- Computer Name
- User Name
- Department
- Email ID
- Mobile Number
- IP Address
- Make
- Model
- CPU
- RAM
- HDD and Type
- OS
- Status
- Remarks
- Maintenance Indicator

### Table Interactions

- Sticky header row
- Sort by asset code, user name, department, status, and asset code
- Search by asset code, user name, IP address, email, or computer name
- Row hover highlight
- Zebra striping
- Inline quick status badge
- Maintenance icon or dot indicator

## 9. Asset Inventory Row Actions

### Admin View

- Edit
- Delete
- View details
- Optional transfer/reassign action

### HR View

- No actions displayed
- Read-only row click to open detail drawer

## 10. Asset Form Modal

The add/edit form should be grouped for speed and clarity.

### Section A: Basic Info

- Asset Code
- Computer Name
- User Name
- Department
- Email ID
- Mobile Number
- Status
- Remarks

### Section B: Hardware Specs

- Make
- Model
- CPU
- RAM
- HDD and Type
- OS

### Section C: Network Info

- IP Address
- Domain / connectivity notes

### Section D: Maintenance Info

- Last maintenance date
- Next maintenance date
- Maintenance remarks

### Form UX

- Required fields marked clearly
- Auto-focus on first invalid field
- Save and cancel buttons fixed to modal footer
- Inline validation messages

---

# Module 2: Category Assets

## 11. Purpose

Track shared or location-based assets that are not assigned to a single employee, such as air conditioners, fixtures, biometric devices, and networking equipment.

## 12. Page Layout

### Top Bar

- Page title: Category Assets
- Search by asset code, product name, location, department, or status
- Filter by:
  - Asset Class
  - Status
  - Location
  - Responsibility

### Main Table Columns

- Asset Class
- Product Name
- Asset Code
- Location / Office
- Department
- Responsibility
- Make
- Model
- Description
- Status
- Last Maintenance
- Additional Support
- Remarks

### UI Behavior

- Group rows by Asset Class
- Optional collapsible groups for each class
- Badge-style status display
- Support quick filtering by class
- Row detail drawer for longer descriptions or service notes

## 13. Special Handling for AC Assets

Air conditioner assets should have an emphasized maintenance marker because they already use service schedules in the template.

Recommended row-level cues:

- Planned maintenance due soon: amber badge
- Completed service: green badge
- Issue detected: red badge

---

# Module 3: Stock Management

## 14. Purpose

Track inventory items in quantities rather than individual assignment.

## 15. Page Layout

### Sections

- RAM
- HDD
- Drives
- Wifi Adapters
- Mobiles
- GPS Trackers
- Devices
- Network Switch & Router
- Tools
- Other Equipment

### Table Columns

- Item Name
- Type / Specification
- Brand
- Quantity
- Status
- Remarks

### UX Requirements

- Inline editing for admin users
- Add new item from top bar
- Highlight low stock rows
- Allow grouping by category
- Support quick scan for available spare parts

## 16. Stock Status Rules

- New: green or blue badge
- Used: neutral badge
- Faulty: red badge
- Low stock: amber row highlight

## 17. Stock Entry Behavior

Admin should be able to update quantity directly inside the table without opening a full form when only the quantity changes.

Recommended inline controls:

- Click-to-edit quantity
- Enter to save
- Escape to cancel
- Change log displayed in detail drawer

---

# Module 4: Maintenance and Service Tracking

## 18. Purpose

Replicate the AC service schedule and AC checklist workflows from Excel into structured digital forms.

## 19. Service Schedule View

Each asset should appear as a block or accordion panel.

### Header

- AC Name or asset label
- Asset Code
- Location

### Table Columns

- Year
- Month Range
- Planned Date
- Actual Date
- Status

### Status Logic

- Empty actual date: Pending
- Actual date filled: Completed
- Issue text present: Issue / Exception state
- Not required: neutral state

### UX Behavior

- Admin can edit actual date and status inline
- HR can only view schedule history
- Panels should support quick expansion and collapse
- Service schedule should visually separate each year

## 20. Maintenance Checklist View

Use a form-based layout with clearly grouped checklist items.

### Header Fields

- Asset Code
- Vendor Name
- Location
- A/C Detail
- Conducted On
- Time

### Checklist Sections

- Thermostat
- Condenser coil
- Wiring and connections
- Blower belt
- Voltage and amperage
- Compressor contactor
- Gas level
- Drain system
- Expansion valve and coil temperatures
- Filters
- Lubrication points
- General comments

### Response Options

For each item:

- OK
- NOT OK
- N/A

### Footer Fields

- Overall comment / cost
- Previous service date
- Next service date
- Service engineer sign
- Office admin sign

### Checklist UX

- Split into sections if long
- Sticky summary/save bar at bottom
- Validation for mandatory service dates and overall comment
- Admin-only save/edit
- HR read-only view

---

# Layout and Interaction Details

## 21. Table System

### Table Features

- Sticky header
- Column sorting
- Row hover
- Zebra striping
- Search and filters above table
- Horizontal scrolling for wide tables
- Compact row density by default
- Optional row expansion for detail preview

### Table Utility Pattern

- Search
- Filter
- Reset
- Export
- Column chooser optional

## 22. Detail Drawer Pattern

For any record, clicking a row opens a right-side drawer with:

- Summary fields
- Maintenance or assignment details
- Edit actions for admin only
- Read-only metadata for HR

## 23. Modal Pattern

Use modals only for:

- Create asset
- Edit asset
- Add stock item
- Quick update confirmation
- Service note entry

Modals should not replace the main table flow for routine review.

---

# Role-Based UX Rules

## 24. System Admin View

- Shows Add, Edit, Delete, Save, and Inline Edit controls
- Can manage all data
- Can see action buttons in tables and drawers
- Can add new maintenance records and stock items

## 25. HR View

- Read-only only
- No add/edit/delete buttons
- May search, filter, export, and inspect data
- Same table layout as admin to preserve familiarity

---

# Recommended Module Pages

## 26. Pages to Build

- Dashboard overview
- Laptops inventory page
- Servers inventory page
- Category assets page
- Stock management page
- Service schedule page
- Maintenance checklist page
- Asset detail drawer or page
- Admin edit forms
- HR read-only reports view

## 27. Suggested Empty States

- No assets available
- No stock records in this category
- No maintenance schedules configured
- No checklist submitted yet
- No results found for current filters

## 28. Suggested Export Support

- Excel export for all major tables
- CSV export for inventory and stock pages
- Print-friendly checklist and service schedule view

## 29. Responsive Strategy

- Desktop-first design
- Tables remain primary on large screens
- On smaller screens, use stacked detail drawers and compressed row presentation
- Avoid converting dense tables into card-only layouts

## 30. Design Outcome

This asset management interface should feel like a professional internal operations system that replaces spreadsheet chaos with structured records, clearer workflows, and safer permissions while staying familiar to users who currently work from Excel.
