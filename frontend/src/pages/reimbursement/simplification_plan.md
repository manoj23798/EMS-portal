# Simplified & Compressed UI Implementation Plan

The user wants a more minimal, high-density UI ("compressed") without "unwanted colors" like dark black or blue. I will move away from the "Oversized Premium" look to a "Clean & Efficient" aesthetic.

## Proposed Changes

### [CSS Global Layer]
#### [MODIFY] [index.css](file:///c:/Users/91936/Documents/project%203/EMS%20TESTING%202/frontend/src/index.css)
- Soften utility colors (replace dark backgrounds with soft grays or whites).
- Ensure "p-20" and "p-12" are redefined to be much smaller to automatically compress existing layouts.
- Reduce font size base for "text-4xl", "text-3xl", etc.

### [Reimbursement Module]
#### [MODIFY] [ReimbursementView.jsx](file:///c:/Users/91936/Documents/project%203/EMS%20TESTING%202/frontend/src/pages/reimbursement/ReimbursementView.jsx)
- **DELETE** the top black "Review Mode" bar.
- Reduce container padding and title sizes.
- Flatten the layout (less shadow, tighter sections).
- Use a simple status badge without heavy borders.

#### [MODIFY] [AdminReimbursementDashboard.jsx](file:///c:/Users/91936/Documents/project%203/EMS%20TESTING%202/frontend/src/pages/reimbursement/AdminReimbursementDashboard.jsx)
- Compress table rows (reduce padding from `p-6` to `p-3`).
- Simplify the header (remove large title, use subtle text).
- Use a white/border style for buttons instead of solid dark colors.

#### [MODIFY] [ReimbursementHistory.jsx](file:///c:/Users/91936/Documents/project%203/EMS%20TESTING%202/frontend/src/pages/reimbursement/ReimbursementHistory.jsx)
- Compress the table layout.

## Verification Plan
1. Ensure no page has massive white space (oversized padding).
2. Check that no component uses `bg-gray-900` or heavy blues.
3. Verify that the UI feels "tight" and "efficient" rather than "spread out".
