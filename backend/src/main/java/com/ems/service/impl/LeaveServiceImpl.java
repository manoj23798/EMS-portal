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
import com.ems.repository.LeaveTypeRepository;
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
    private final LeaveTypeRepository leaveTypeRepository;

    @Override
    @Transactional
    public LeaveRequestResponse applyLeave(LeaveApplyRequest request) {
        Employee employee = getEmployeeOrThrow(request.getEmployeeId());
        com.ems.entity.LeaveType leaveType = leaveTypeRepository.findById(request.getLeaveTypeId())
                .orElseThrow(() -> new RuntimeException("Leave type not found"));

        if (request.getEndDate().isBefore(request.getStartDate())) {
            throw new RuntimeException("End date must be on or after start date.");
        }

        List<LeaveRequest> overlapping = leaveRequestRepository.findOverlapping(
                employee, request.getStartDate(), request.getEndDate());
        if (!overlapping.isEmpty()) {
            throw new RuntimeException("Overlapping leave request already exists for the selected dates.");
        }

        double totalDays = (double) ChronoUnit.DAYS.between(request.getStartDate(), request.getEndDate()) + 1;

        // Custom Accrual & LOP Engine
        double accrued = calculateTotalAccrued(employee);
        double taken = leaveRequestRepository.findByEmployee(employee).stream()
                .filter(lr -> "Approved".equals(lr.getStatus()) && !lr.isLop())
                .map(LeaveRequest::getTotalDays)
                .mapToDouble(d -> d != null ? d : 0.0)
                .sum();
        
        double available = Math.max(0, accrued - taken);
        double lopCount = 0.0;
        boolean isLop = false;

        if (totalDays > available) {
            lopCount = totalDays - available;
            isLop = true;
        }

        LeaveRequest leaveRequest = LeaveRequest.builder()
                .employee(employee)
                .leaveType(leaveType)
                .startDate(request.getStartDate())
                .endDate(request.getEndDate())
                .totalDays(totalDays)
                .reason(request.getReason())
                .attachmentUrl(request.getAttachmentUrl())
                .status("Pending")
                .isLop(isLop)
                .lopCount(lopCount)
                .build();

        return mapToResponse(leaveRequestRepository.save(leaveRequest));
    }

    private double calculateTotalAccrued(Employee employee) {
        LocalDate joinDate = employee.getJoiningDate();
        LocalDate now = LocalDate.now();
        
        long totalMonths = ChronoUnit.MONTHS.between(joinDate.withDayOfMonth(1), now.withDayOfMonth(1)) + 1;
        if (totalMonths <= 0) return 0.0;

        double accrued = 0.0;
        for (int i = 0; i < totalMonths; i++) {
            if (i < 6) {
                accrued += 1.0;
            } else {
                accrued += 1.5;
            }
        }
        return accrued;
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
        
        // Calculate dynamic balance vs cached balance
        double accrued = calculateTotalAccrued(employee);
        double taken = leaveRequestRepository.findByEmployee(employee).stream()
                .filter(lr -> "Approved".equals(lr.getStatus()) && !lr.isLop())
                .map(LeaveRequest::getTotalDays)
                .mapToDouble(d -> d != null ? d : 0.0)
                .sum();
        
        double available = Math.max(0.0, accrued - taken);

        return List.of(LeaveBalanceResponse.builder()
                .leaveType("Casual Leave")
                .totalLeaves(accrued)
                .usedLeaves(taken)
                .remainingLeaves(available)
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
                .orElseThrow(() -> new RuntimeException("Leave request not found."));
        Employee manager = getEmployeeOrThrow(managerId);

        if (!"Pending".equals(leaveRequest.getStatus())) {
            throw new RuntimeException("Leave request is already " + leaveRequest.getStatus());
        }

        leaveRequest.setStatus("Approved");
        leaveRequest.setApprovedBy(manager);
        leaveRequest.setRemarks(remarks);

        // ===== ATTENDANCE INTEGRATION =====
        Employee employee = leaveRequest.getEmployee();
        LocalDate current = leaveRequest.getStartDate();
        while (!current.isAfter(leaveRequest.getEndDate())) {
            final LocalDate dateToSearch = current;
            if (attendanceRepository.findByEmployeeAndDate(employee, dateToSearch).isEmpty()) {
                Attendance leaveAttendance = Attendance.builder()
                        .employee(employee)
                        .date(dateToSearch)
                        .status(leaveRequest.isLop() ? "LOP" : "Leave")
                        .breakDuration(0L)
                        .totalHours(0L)
                        .build();
                attendanceRepository.save(leaveAttendance);
            }
            current = current.plusDays(1);
        }

        // ===== DEDUCT LEAVE BALANCE (Only if not full LOP) =====
        double accrued = calculateTotalAccrued(employee);
        double taken = leaveRequestRepository.findByEmployee(employee).stream()
                .filter(lr -> "Approved".equals(lr.getStatus()) && !lr.isLop())
                .map(LeaveRequest::getTotalDays)
                .mapToDouble(d -> d != null ? d : 0.0)
                .sum();
        
        double available = Math.max(0.0, accrued - taken);

        // Update or Create cached balance
        int currentYear = leaveRequest.getStartDate().getYear();
        LeaveBalance balance = leaveBalanceRepository
                .findByEmployeeAndLeaveTypeAndYear(employee, leaveRequest.getLeaveType().getName(), currentYear)
                .orElse(LeaveBalance.builder()
                        .employee(employee)
                        .leaveType(leaveRequest.getLeaveType().getName())
                        .year(currentYear)
                        .build());
        
        balance.setTotalLeaves(accrued);
        balance.setUsedLeaves(taken);
        balance.setRemainingLeaves(available);
        leaveBalanceRepository.save(balance);

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
        Employee employee = lr.getEmployee();
        double accrued = calculateTotalAccrued(employee);
        double taken = leaveRequestRepository.findByEmployee(employee).stream()
                .filter(req -> "Approved".equals(req.getStatus()) && !req.isLop())
                .map(LeaveRequest::getTotalDays)
                .mapToDouble(d -> d != null ? d : 0.0)
                .sum();
        double available = Math.max(0.0, accrued - taken);

        return LeaveRequestResponse.builder()
                .id(lr.getId())
                .employeeId(lr.getEmployee().getId())
                .employeeName(lr.getEmployee().getFirstName() + " " + lr.getEmployee().getLastName())
                .leaveType(lr.getLeaveType().getName())
                .leaveTypeColor(lr.getLeaveType().getColor())
                .isLop(lr.isLop())
                .startDate(lr.getStartDate())
                .endDate(lr.getEndDate())
                .totalDays(lr.getTotalDays())
                .reason(lr.getReason())
                .attachmentUrl(lr.getAttachmentUrl())
                .status(lr.getStatus())
                .approvedByName(lr.getApprovedBy() != null ?
                        lr.getApprovedBy().getFirstName() + " " + lr.getApprovedBy().getLastName() : null)
                .designation(lr.getEmployee().getDesignation() != null ? lr.getEmployee().getDesignation().getTitle() : "N/A")
                .department(lr.getEmployee().getDepartment() != null ? lr.getEmployee().getDepartment().getName() : "N/A")
                .remarks(lr.getRemarks())
                .lopCount(lr.getLopCount())
                .leaveBalance(available)
                .createdAt(lr.getCreatedAt())
                .build();
    }
}
