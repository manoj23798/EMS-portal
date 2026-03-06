package com.ems.service.impl;

import com.ems.dto.request.LeaveApplyRequest;
import com.ems.dto.response.LeaveBalanceResponse;
import com.ems.dto.response.LeaveRequestResponse;
import com.ems.entity.Attendance;
import com.ems.entity.Employee;
import com.ems.entity.LeaveBalance;
import com.ems.entity.LeaveRequest;
import com.ems.repository.AttendanceRepository;
import com.ems.repository.EmployeeRepository;
import com.ems.repository.LeaveBalanceRepository;
import com.ems.repository.LeaveRequestRepository;
import com.ems.service.LeaveService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class LeaveServiceImpl implements LeaveService {

    private final LeaveRequestRepository leaveRequestRepository;
    private final LeaveBalanceRepository leaveBalanceRepository;
    private final AttendanceRepository attendanceRepository;
    private final EmployeeRepository employeeRepository;

    @Override
    @Transactional
    public LeaveRequestResponse applyLeave(LeaveApplyRequest request) {
        Employee employee = getEmployeeOrThrow(request.getEmployeeId());

        // Validate end date >= start date
        if (request.getEndDate().isBefore(request.getStartDate())) {
            throw new RuntimeException("End date must be on or after start date.");
        }

        // Check for overlapping leave requests
        List<LeaveRequest> overlapping = leaveRequestRepository.findOverlapping(
                employee, request.getStartDate(), request.getEndDate());
        if (!overlapping.isEmpty()) {
            throw new RuntimeException("Overlapping leave request already exists for the selected dates.");
        }

        int totalDays = (int) ChronoUnit.DAYS.between(request.getStartDate(), request.getEndDate()) + 1;

        // Check leave balance
        int currentYear = request.getStartDate().getYear();
        LeaveBalance balance = leaveBalanceRepository
                .findByEmployeeAndLeaveTypeAndYear(employee, request.getLeaveType(), currentYear)
                .orElse(null);

        if (balance != null && balance.getRemainingLeaves() < totalDays
                && !request.getLeaveType().equalsIgnoreCase("Unpaid Leave")) {
            throw new RuntimeException("Insufficient leave balance. Available: " + balance.getRemainingLeaves() + " days.");
        }

        LeaveRequest leaveRequest = LeaveRequest.builder()
                .employee(employee)
                .leaveType(request.getLeaveType())
                .startDate(request.getStartDate())
                .endDate(request.getEndDate())
                .totalDays(totalDays)
                .reason(request.getReason())
                .attachmentUrl(request.getAttachmentUrl())
                .status("Pending")
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
        return leaveBalanceRepository.findByEmployeeAndYear(employee, currentYear).stream()
                .map(b -> LeaveBalanceResponse.builder()
                        .id(b.getId())
                        .leaveType(b.getLeaveType())
                        .totalLeaves(b.getTotalLeaves())
                        .usedLeaves(b.getUsedLeaves())
                        .remainingLeaves(b.getRemainingLeaves())
                        .year(b.getYear())
                        .build())
                .collect(Collectors.toList());
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
                .orElseThrow(() -> new RuntimeException("Leave request not found."));
        Employee manager = getEmployeeOrThrow(managerId);

        if (!"Pending".equals(leaveRequest.getStatus())) {
            throw new RuntimeException("Leave request is already " + leaveRequest.getStatus());
        }

        leaveRequest.setStatus("Approved");
        leaveRequest.setApprovedBy(manager);
        leaveRequest.setRemarks(remarks);

        // ===== ATTENDANCE INTEGRATION =====
        // Create attendance records with status "Leave" for each day
        Employee employee = leaveRequest.getEmployee();
        LocalDate current = leaveRequest.getStartDate();
        while (!current.isAfter(leaveRequest.getEndDate())) {
            // Only create if no existing record
            if (attendanceRepository.findByEmployeeAndDate(employee, current).isEmpty()) {
                Attendance leaveAttendance = Attendance.builder()
                        .employee(employee)
                        .date(current)
                        .status("Leave")
                        .breakDuration(0L)
                        .totalHours(0L)
                        .build();
                attendanceRepository.save(leaveAttendance);
            }
            current = current.plusDays(1);
        }

        // ===== DEDUCT LEAVE BALANCE =====
        int currentYear = leaveRequest.getStartDate().getYear();
        LeaveBalance balance = leaveBalanceRepository
                .findByEmployeeAndLeaveTypeAndYear(employee, leaveRequest.getLeaveType(), currentYear)
                .orElse(null);
        if (balance != null) {
            balance.setUsedLeaves(balance.getUsedLeaves() + leaveRequest.getTotalDays());
            balance.setRemainingLeaves(balance.getTotalLeaves() - balance.getUsedLeaves());
            leaveBalanceRepository.save(balance);
        }

        return mapToResponse(leaveRequestRepository.save(leaveRequest));
    }

    @Override
    @Transactional
    public LeaveRequestResponse rejectLeave(Long leaveId, Long managerId, String remarks) {
        LeaveRequest leaveRequest = leaveRequestRepository.findById(leaveId)
                .orElseThrow(() -> new RuntimeException("Leave request not found."));
        Employee manager = getEmployeeOrThrow(managerId);

        if (!"Pending".equals(leaveRequest.getStatus())) {
            throw new RuntimeException("Leave request is already " + leaveRequest.getStatus());
        }

        leaveRequest.setStatus("Rejected");
        leaveRequest.setApprovedBy(manager);
        leaveRequest.setRemarks(remarks);

        return mapToResponse(leaveRequestRepository.save(leaveRequest));
    }

    private Employee getEmployeeOrThrow(Long id) {
        return employeeRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Employee not found with id " + id));
    }

    private LeaveRequestResponse mapToResponse(LeaveRequest lr) {
        return LeaveRequestResponse.builder()
                .id(lr.getId())
                .employeeId(lr.getEmployee().getId())
                .employeeName(lr.getEmployee().getFirstName() + " " + lr.getEmployee().getLastName())
                .leaveType(lr.getLeaveType())
                .startDate(lr.getStartDate())
                .endDate(lr.getEndDate())
                .totalDays(lr.getTotalDays())
                .reason(lr.getReason())
                .attachmentUrl(lr.getAttachmentUrl())
                .status(lr.getStatus())
                .approvedByName(lr.getApprovedBy() != null ?
                        lr.getApprovedBy().getFirstName() + " " + lr.getApprovedBy().getLastName() : null)
                .remarks(lr.getRemarks())
                .createdAt(lr.getCreatedAt())
                .build();
    }
}
