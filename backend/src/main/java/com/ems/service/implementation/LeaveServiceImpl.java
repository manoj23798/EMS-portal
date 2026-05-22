package com.ems.service.implementation;

import com.ems.dto.request.LeaveApplyRequest;
import com.ems.dto.response.LeaveBalanceResponse;
import com.ems.dto.response.LeaveRequestResponse;
import com.ems.entity.Attendance.Attendance;
import com.ems.entity.Employee.Employee;
import com.ems.entity.leave_And_permission.LeaveBalance;
import com.ems.entity.leave_And_permission.LeaveRequest;
import com.ems.entity.leave_And_permission.LeaveType;
import com.ems.exception.ResourceNotFoundException;
import com.ems.repository.Attendance.AttendanceRepository;
import com.ems.repository.Employee.EmployeeRepository;
import com.ems.repository.Leave_and_permission.LeaveBalanceRepository;
import com.ems.repository.Leave_and_permission.LeaveRequestRepository;
import com.ems.repository.Leave_and_permission.LeaveTypeRepository;
import com.ems.service.Interface.LeaveService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class LeaveServiceImpl implements LeaveService {

    private final LeaveRequestRepository leaveRequestRepository;
    private final LeaveBalanceRepository leaveBalanceRepository;
    private final AttendanceRepository attendanceRepository;
    private final EmployeeRepository employeeRepository;
    private final LeaveTypeRepository leaveTypeRepository;

    private static final String PLANNED_LEAVE = "planned leave";
    private static final String URGENT_LEAVE = "urgent leave";
    private static final int PROBATION_MONTHS = 6;

    @Override
    @Transactional
    public LeaveRequestResponse applyLeave(LeaveApplyRequest request) {
        Employee employee = getEmployeeOrThrow(request.getEmployeeId());
        LeaveType leaveType = leaveTypeRepository.findById(request.getLeaveTypeId())
                .orElseThrow(() -> new ResourceNotFoundException("Leave type not found"));

        if (request.getEndDate().isBefore(request.getStartDate())) {
            throw new IllegalArgumentException("End date must be on or after start date.");
        }

        String leaveTypeName = normalizeLeaveTypeName(leaveType.getName());
        if (!PLANNED_LEAVE.equals(leaveTypeName) && !URGENT_LEAVE.equals(leaveTypeName)) {
            throw new IllegalArgumentException("Only Planned Leave and Urgent Leave are allowed.");
        }

        // Planned leave under 5 days is allowed; frontend shows warning only.

        List<LeaveRequest> overlapping = leaveRequestRepository.findOverlapping(
                employee, request.getStartDate(), request.getEndDate());
        if (!overlapping.isEmpty()) {
            throw new IllegalArgumentException("Overlapping leave request already exists for the selected dates.");
        }

        double totalDays = (double) ChronoUnit.DAYS.between(request.getStartDate(), request.getEndDate()) + 1;

        // Recompute allocation against current approved history to avoid stale LOP
        // values
        LeaveAllocationSnapshot allocation = calculateLeaveAllocation(employee, request.getStartDate(),
                request.getEndDate(), null);

        LeaveRequest leaveRequest = LeaveRequest.builder()
                .employee(employee)
                .leaveType(leaveType)
                .startDate(request.getStartDate())
                .endDate(request.getEndDate())
                .totalDays(totalDays)
                .reason(request.getReason())
                .attachmentUrl(request.getAttachmentUrl())
                .status("Pending")
                .isLop(allocation.lopDays > 0)
                .lopCount(allocation.lopDays)
                .build();

        return mapToResponse(leaveRequestRepository.save(leaveRequest));
    }

    @Override
    public List<LeaveRequestResponse> getMyLeaves(Long employeeId) {
        Employee employee = getEmployeeOrThrow(employeeId);
        return leaveRequestRepository.findByEmployeeOrderByCreatedAtDesc(employee).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    public List<LeaveBalanceResponse> getMyBalance(Long employeeId) {
        Employee employee = getEmployeeOrThrow(employeeId);
        int currentYear = LocalDate.now().getYear();
        BalanceSnapshot snapshot = calculateCurrentBalance(employee);

        return List.of(LeaveBalanceResponse.builder()
                .leaveType("Leave Balance")
                .totalLeaves(snapshot.totalAccrued)
                .usedLeaves(snapshot.totalUsed)
                .remainingLeaves(snapshot.availableLeaves)
                .year(currentYear)
                .build());
    }

    @Override
    public List<LeaveRequestResponse> getPendingRequests() {
        return leaveRequestRepository.findByStatusOrderByCreatedAtDesc("Pending").stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    public List<LeaveRequestResponse> getAllLeaves() {
        return leaveRequestRepository.findAll().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public LeaveRequestResponse approveLeave(Long leaveId, Long managerId, String remarks) {
        LeaveRequest leaveRequest = leaveRequestRepository.findById(leaveId)
                .orElseThrow(() -> new ResourceNotFoundException("Leave request not found."));
        Employee manager = getEmployeeOrThrow(managerId);

        if (!"Pending".equals(leaveRequest.getStatus())) {
            throw new IllegalArgumentException("Leave request is already " + leaveRequest.getStatus());
        }

        leaveRequest.setStatus("Approved");
        leaveRequest.setApprovedBy(manager);
        leaveRequest.setRemarks(remarks);
        leaveRequest.setApprovedAt(LocalDateTime.now());

        // Recompute paid/LOP split at approval time to keep calculations accurate.
        LeaveAllocationSnapshot allocation = calculateLeaveAllocation(
                leaveRequest.getEmployee(),
                leaveRequest.getStartDate(),
                leaveRequest.getEndDate(),
                leaveRequest.getId());
        leaveRequest.setLopCount(allocation.lopDays);
        leaveRequest.setLop(allocation.lopDays > 0);

        // ===== ATTENDANCE INTEGRATION =====
        Employee employee = leaveRequest.getEmployee();
        LocalDate current = leaveRequest.getStartDate();
        int paidDays = (int) Math.floor(getPaidDays(leaveRequest));
        int dayIndex = 0;
        while (!current.isAfter(leaveRequest.getEndDate())) {
            final LocalDate dateToSearch = current;
            if (attendanceRepository.findByEmployeeAndDate(employee, dateToSearch).isEmpty()) {
                Attendance leaveAttendance = Attendance.builder()
                        .employee(employee)
                        .date(dateToSearch)
                        .status(dayIndex < paidDays ? "Leave" : (leaveRequest.isLop() ? "LOP" : "Leave"))
                        .breakDuration(0L)
                        .totalHours(0L)
                        .build();
                attendanceRepository.save(leaveAttendance);
            }
            current = current.plusDays(1);
            dayIndex++;
        }

        BalanceSnapshot snapshot = calculateCurrentBalance(employee);

        // Update or Create cached balance
        int currentYear = leaveRequest.getStartDate().getYear();
        LeaveBalance balance = leaveBalanceRepository
                .findByEmployeeAndLeaveTypeAndYear(employee, "Leave Balance", currentYear)
                .orElse(LeaveBalance.builder()
                        .employee(employee)
                        .leaveType("Leave Balance")
                        .year(currentYear)
                        .build());

        balance.setTotalLeaves(snapshot.totalAccrued);
        balance.setUsedLeaves(snapshot.totalUsed);
        balance.setRemainingLeaves(snapshot.availableLeaves);
        leaveBalanceRepository.save(balance);
        leaveBalanceRepository.deleteByEmployeeAndYearAndLeaveTypeNot(employee, currentYear, "Leave Balance");

        return mapToResponse(leaveRequestRepository.save(leaveRequest));
    }

    @Override
    @Transactional
    public LeaveRequestResponse rejectLeave(Long leaveId, Long managerId, String remarks) {
        LeaveRequest leaveRequest = leaveRequestRepository.findById(leaveId)
                .orElseThrow(() -> new ResourceNotFoundException("Leave request not found."));
        Employee manager = getEmployeeOrThrow(managerId);

        if (!"Pending".equals(leaveRequest.getStatus())) {
            throw new IllegalArgumentException("Leave request is already " + leaveRequest.getStatus());
        }

        leaveRequest.setStatus("Rejected");
        leaveRequest.setApprovedBy(manager);
        leaveRequest.setRemarks(remarks);
        leaveRequest.setRejectedAt(LocalDateTime.now());
        leaveRequest.setCancelReason(null);

        return mapToResponse(leaveRequestRepository.save(leaveRequest));
    }

    @Override
    @Transactional
    public LeaveRequestResponse cancelLeave(Long leaveId, Long employeeId, String cancelReason) {
        LeaveRequest leaveRequest = leaveRequestRepository.findById(leaveId)
                .orElseThrow(() -> new ResourceNotFoundException("Leave request not found."));
        Employee employee = getEmployeeOrThrow(employeeId);

        if (!leaveRequest.getEmployee().getId().equals(employee.getId())) {
            throw new IllegalArgumentException("You can only cancel your own leave requests.");
        }

        String status = leaveRequest.getStatus();
        if (!("Pending".equalsIgnoreCase(status) || "Approved".equalsIgnoreCase(status))) {
            throw new IllegalArgumentException("Only Pending or Approved leave can be canceled.");
        }

        boolean wasApproved = "Approved".equalsIgnoreCase(status);

        leaveRequest.setStatus("Canceled");
        leaveRequest.setCancelReason(cancelReason != null ? cancelReason.trim() : "");

        if (wasApproved) {
            removeAutoGeneratedLeaveAttendance(employee, leaveRequest.getStartDate(), leaveRequest.getEndDate());

            BalanceSnapshot snapshot = calculateCurrentBalance(employee);
            int currentYear = leaveRequest.getStartDate() != null
                    ? leaveRequest.getStartDate().getYear()
                    : LocalDate.now().getYear();

            LeaveBalance balance = leaveBalanceRepository
                    .findByEmployeeAndLeaveTypeAndYear(employee, "Leave Balance", currentYear)
                    .orElse(LeaveBalance.builder()
                            .employee(employee)
                            .leaveType("Leave Balance")
                            .year(currentYear)
                            .build());

            balance.setTotalLeaves(snapshot.totalAccrued);
            balance.setUsedLeaves(snapshot.totalUsed);
            balance.setRemainingLeaves(snapshot.availableLeaves);
            leaveBalanceRepository.save(balance);
            leaveBalanceRepository.deleteByEmployeeAndYearAndLeaveTypeNot(employee, currentYear, "Leave Balance");
        }

        return mapToResponse(leaveRequestRepository.save(leaveRequest));
    }

    private Employee getEmployeeOrThrow(Long id) {
        return employeeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Employee not found with id " + id));
    }

    private String normalizeLeaveTypeName(String leaveTypeName) {
        return leaveTypeName == null ? "" : leaveTypeName.trim().toLowerCase();
    }

    private BalanceSnapshot calculateCurrentBalance(Employee employee) {
        LocalDate today = LocalDate.now();
        LocalDate joiningDate = employee.getJoiningDate();
        if (joiningDate == null || today.isBefore(joiningDate)) {
            return new BalanceSnapshot(0.0, 0.0, 0.0);
        }

        LocalDate probationEnd = joiningDate.plusMonths(PROBATION_MONTHS).minusDays(1);
        List<LeaveRequest> approvedRequests = leaveRequestRepository.findByEmployee(employee).stream()
                .filter(lr -> "Approved".equalsIgnoreCase(lr.getStatus()))
                .collect(Collectors.toList());

        // PROVISIONAL PERIOD: Monthly bucket, no carryover
        if (!today.isAfter(probationEnd)) {
            LocalDate currentMonthStart = today.withDayOfMonth(1);
            double probationAccrued = 1.0; // 1 day per month
            double probationUsed = calculateConsumedLeaves(approvedRequests, currentMonthStart, today);
            double probationRemaining = Math.max(0.0, probationAccrued - probationUsed);
            return new BalanceSnapshot(probationAccrued, probationUsed, probationRemaining);
        }

        // PERMANENT PERIOD: Accumulates month-by-month within calendar year
        LocalDate postProbationStart = probationEnd.plusDays(1);
        LocalDate currentYearStart = LocalDate.of(today.getYear(), 1, 1);
        LocalDate effectiveStart = postProbationStart.isAfter(currentYearStart) ? postProbationStart : currentYearStart;

        // Calculate accumulated balance from effective start to today
        // For each complete month + partial month, accrue 1.5 days
        double accruedTillToday = calculateAccruedLeaves(effectiveStart, today, 1.5);
        double usedTillToday = calculateConsumedLeaves(approvedRequests, effectiveStart, today);
        double balanceRemaining = Math.max(0.0, accruedTillToday - usedTillToday);

        return new BalanceSnapshot(accruedTillToday, usedTillToday, balanceRemaining);
    }

    private double calculateAccruedLeaves(LocalDate start, LocalDate end, double monthlyRate) {
        if (start == null || end == null || end.isBefore(start)) {
            return 0.0;
        }

        long months = ChronoUnit.MONTHS.between(start.withDayOfMonth(1), end.withDayOfMonth(1)) + 1;
        return months <= 0 ? 0.0 : months * monthlyRate;
    }

    private double calculateConsumedLeaves(List<LeaveRequest> requests, LocalDate rangeStart, LocalDate rangeEnd) {
        if (rangeStart == null || rangeEnd == null || rangeEnd.isBefore(rangeStart)) {
            return 0.0;
        }

        double consumed = 0.0;
        for (LeaveRequest request : requests) {
            if (request.getStartDate() == null || request.getEndDate() == null) {
                continue;
            }

            int paidDays = (int) Math.floor(getPaidDays(request));
            if (paidDays <= 0) {
                continue;
            }

            LocalDate cursor = request.getStartDate();
            int allocated = 0;
            while (!cursor.isAfter(request.getEndDate()) && allocated < paidDays) {
                if (!cursor.isBefore(rangeStart) && !cursor.isAfter(rangeEnd)) {
                    consumed += 1.0;
                }
                cursor = cursor.plusDays(1);
                allocated++;
            }
        }

        return consumed;
    }

    private LeaveAllocationSnapshot calculateLeaveAllocation(Employee employee, LocalDate startDate, LocalDate endDate,
            Long excludeLeaveRequestId) {
        if (employee == null || startDate == null || endDate == null || endDate.isBefore(startDate)) {
            return new LeaveAllocationSnapshot(0.0, 0.0);
        }

        LocalDate joiningDate = employee.getJoiningDate();
        if (joiningDate == null) {
            double totalDays = ChronoUnit.DAYS.between(startDate, endDate) + 1;
            return new LeaveAllocationSnapshot(0.0, totalDays);
        }

        List<LeaveRequest> approvedRequests = leaveRequestRepository.findByEmployee(employee).stream()
                .filter(lr -> "Approved".equalsIgnoreCase(lr.getStatus()))
                .filter(lr -> excludeLeaveRequestId == null || !excludeLeaveRequestId.equals(lr.getId()))
                .collect(Collectors.toList());

        LocalDate probationEnd = joiningDate.plusMonths(PROBATION_MONTHS).minusDays(1);
        LocalDate currentYearStart = LocalDate.of(startDate.getYear(), 1, 1);

        double paidDays = 0.0;
        double lopDays = 0.0;

        // Track monthly usage for provisional period
        Map<String, Double> provisionalMonthlyUsed = new HashMap<>();
        // Track yearly usage for permanent period
        double permanentYearlyUsed = 0.0;

        LocalDate cursor = startDate;
        while (!cursor.isAfter(endDate)) {
            // Before joining: all days are LOP
            if (cursor.isBefore(joiningDate)) {
                lopDays += 1.0;
                cursor = cursor.plusDays(1);
                continue;
            }

            // PROVISIONAL PERIOD: 1 day/month, expires each month
            if (!cursor.isAfter(probationEnd)) {
                String monthKey = cursor.getYear() + "-" + String.format("%02d", cursor.getMonthValue());
                LocalDate monthStart = cursor.withDayOfMonth(1);
                LocalDate monthEnd = cursor.withDayOfMonth(cursor.lengthOfMonth());

                // Days already approved in this month
                double approvedInMonth = calculateConsumedLeaves(approvedRequests, monthStart, monthEnd);
                // Days already allocated in THIS REQUEST for this month
                double allocatedInRequest = provisionalMonthlyUsed.getOrDefault(monthKey, 0.0);

                // Available capacity in this month: 1.0 - already used
                double capacityRemaining = Math.max(0.0, 1.0 - approvedInMonth - allocatedInRequest);

                if (capacityRemaining >= 1.0) {
                    // Can allocate this day as PAID
                    paidDays += 1.0;
                    provisionalMonthlyUsed.put(monthKey, allocatedInRequest + 1.0);
                } else {
                    // No capacity left this month: becomes LOP
                    lopDays += 1.0;
                }
            } else {
                // PERMANENT PERIOD: 1.5 days/month, accumulates within year, resets Jan 1
                LocalDate permanentStart = probationEnd.plusDays(1);

                // Year boundary: reset if new calendar year
                if (cursor.getYear() > startDate.getYear()) {
                    currentYearStart = LocalDate.of(cursor.getYear(), 1, 1);
                    permanentYearlyUsed = 0.0;
                }

                LocalDate effectiveStart = permanentStart.isAfter(currentYearStart) ? permanentStart : currentYearStart;

                // If cursor is before effective start (e.g., in old year before probation end),
                // count as LOP
                if (cursor.isBefore(effectiveStart)) {
                    lopDays += 1.0;
                    cursor = cursor.plusDays(1);
                    continue;
                }

                // Cumulative accrual from effective start to cursor
                double accruedTillCursor = calculateAccruedLeaves(effectiveStart, cursor, 1.5);

                // Days already approved in this year from effective start to cursor
                double approvedTillCursor = calculateConsumedLeaves(approvedRequests, effectiveStart, cursor);

                // Available = accrued - already approved - already allocated in this request
                double availableTillCursor = Math.max(0.0,
                        accruedTillCursor - approvedTillCursor - permanentYearlyUsed);

                if (availableTillCursor >= 1.0) {
                    // Can allocate this day as PAID
                    paidDays += 1.0;
                    permanentYearlyUsed += 1.0;
                } else {
                    // No capacity left: becomes LOP
                    lopDays += 1.0;
                }
            }

            cursor = cursor.plusDays(1);
        }

        return new LeaveAllocationSnapshot(paidDays, lopDays);
    }

    private double getPaidDays(LeaveRequest request) {
        double totalDays = request.getTotalDays() != null ? request.getTotalDays() : 0.0;
        double lopDays = request.getLopCount() != null ? request.getLopCount() : 0.0;
        return Math.max(0.0, totalDays - lopDays);
    }

    private void removeAutoGeneratedLeaveAttendance(Employee employee, LocalDate startDate, LocalDate endDate) {
        if (employee == null || startDate == null || endDate == null || endDate.isBefore(startDate)) {
            return;
        }

        LocalDate cursor = startDate;
        while (!cursor.isAfter(endDate)) {
            attendanceRepository.findByEmployeeAndDate(employee, cursor).ifPresent(attendance -> {
                String attendanceStatus = attendance.getStatus() != null ? attendance.getStatus().trim() : "";
                boolean generatedLeaveRow = ("Leave".equalsIgnoreCase(attendanceStatus)
                        || "LOP".equalsIgnoreCase(attendanceStatus))
                        && attendance.getInTime() == null
                        && attendance.getOutTime() == null;

                if (generatedLeaveRow) {
                    attendanceRepository.delete(attendance);
                }
            });
            cursor = cursor.plusDays(1);
        }
    }

    private LeaveRequestResponse mapToResponse(LeaveRequest lr) {
        BalanceSnapshot snapshot = calculateCurrentBalance(lr.getEmployee());
        String leaveTypeName = lr.getLeaveType() != null ? lr.getLeaveType().getName() : "Leave";
        String leaveTypeColor = lr.getLeaveType() != null ? lr.getLeaveType().getColor() : null;

        return LeaveRequestResponse.builder()
                .id(lr.getId())
                .employeeId(lr.getEmployee().getId())
                .employeeName(lr.getEmployee().getFirstName() + " " + lr.getEmployee().getLastName())
                .joiningDate(lr.getEmployee().getJoiningDate())
                .leaveType(leaveTypeName)
                .leaveTypeColor(leaveTypeColor)
                .isLop(lr.isLop())
                .startDate(lr.getStartDate())
                .endDate(lr.getEndDate())
                .totalDays(lr.getTotalDays())
                .reason(lr.getReason())
                .attachmentUrl(lr.getAttachmentUrl())
                .status(lr.getStatus())
                .approvedByName(lr.getApprovedBy() != null
                        ? lr.getApprovedBy().getFirstName() + " " + lr.getApprovedBy().getLastName()
                        : null)
                .designation(lr.getEmployee().getDesignation() != null ? lr.getEmployee().getDesignation().getTitle()
                        : "N/A")
                .department(
                        lr.getEmployee().getDepartment() != null ? lr.getEmployee().getDepartment().getName() : "N/A")
                .remarks(lr.getRemarks())
                .cancelReason(lr.getCancelReason())
                .lopCount(lr.getLopCount())
                .leaveBalance(snapshot.availableLeaves)
                .profilePhotoUrl(lr.getEmployee().getProfilePhotoUrl())
                .createdAt(lr.getCreatedAt())
                .approvedAt(lr.getApprovedAt())
                .rejectedAt(lr.getRejectedAt())
                .build();
    }

    private static class BalanceSnapshot {
        private final double totalAccrued;
        private final double totalUsed;
        private final double availableLeaves;

        private BalanceSnapshot(double totalAccrued, double totalUsed, double availableLeaves) {
            this.totalAccrued = totalAccrued;
            this.totalUsed = totalUsed;
            this.availableLeaves = availableLeaves;
        }
    }

    private static class LeaveAllocationSnapshot {
        private final double paidDays;
        private final double lopDays;

        private LeaveAllocationSnapshot(double paidDays, double lopDays) {
            this.paidDays = paidDays;
            this.lopDays = lopDays;
        }
    }
}
