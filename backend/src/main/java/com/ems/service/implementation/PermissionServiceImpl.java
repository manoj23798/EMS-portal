package com.ems.service.implementation;

import com.ems.dto.request.PermissionApplyRequest;
import com.ems.dto.response.PermissionRequestResponse;
import com.ems.entity.Employee.Employee;
import com.ems.exception.ResourceNotFoundException;
import com.ems.entity.leave_And_permission.PermissionRequest;
import com.ems.repository.Attendance.AttendanceRepository;
import com.ems.repository.Employee.EmployeeRepository;
import com.ems.repository.Leave_and_permission.PermissionRequestRepository;
import com.ems.service.Interface.PermissionService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class PermissionServiceImpl implements PermissionService {

    private final PermissionRequestRepository permissionRequestRepository;
    private final AttendanceRepository attendanceRepository;
    private final EmployeeRepository employeeRepository;

    @Override
    @Transactional
    public PermissionRequestResponse applyPermission(PermissionApplyRequest request) {
        Employee employee = getEmployeeOrThrow(request.getEmployeeId());

        // Validate end time > start time
        if (!request.getEndTime().isAfter(request.getStartTime())) {
            throw new IllegalArgumentException("End time must be after start time.");
        }

        long totalMinutes = Duration.between(request.getStartTime(), request.getEndTime()).toMinutes();

        PermissionRequest permission = PermissionRequest.builder()
                .employee(employee)
                .date(request.getDate())
                .startTime(request.getStartTime())
                .endTime(request.getEndTime())
                .totalHours(totalMinutes)
                .reason(request.getReason())
                .status("Pending")
                .build();

        return mapToResponse(permissionRequestRepository.save(permission));
    }

    @Override
    public List<PermissionRequestResponse> getMyPermissions(Long employeeId) {
        Employee employee = getEmployeeOrThrow(employeeId);
        return permissionRequestRepository.findByEmployeeOrderByCreatedAtDesc(employee).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    public List<PermissionRequestResponse> getPendingPermissions() {
        return permissionRequestRepository.findByStatusOrderByCreatedAtDesc("Pending").stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    public List<PermissionRequestResponse> getAllPermissions() {
        return permissionRequestRepository.findAll().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public PermissionRequestResponse approvePermission(Long permissionId, Long managerId) {
        PermissionRequest permission = permissionRequestRepository.findById(permissionId)
                .orElseThrow(() -> new ResourceNotFoundException("Permission request not found."));
        Employee manager = getEmployeeOrThrow(managerId);

        if (!"Pending".equals(permission.getStatus())) {
            throw new IllegalArgumentException("Permission request is already " + permission.getStatus());
        }

        permission.setStatus("Approved");
        permission.setApprovedBy(manager);

        // ===== ATTENDANCE INTEGRATION =====
        // Update the attendance record for that day with permission hours
        Employee employee = permission.getEmployee();
        attendanceRepository.findByEmployeeAndDate(employee, permission.getDate())
                .ifPresent(attendance -> {
                    long existing = attendance.getPermissionHours() != null ? attendance.getPermissionHours() : 0;
                    attendance.setPermissionHours(existing + permission.getTotalHours());
                    attendanceRepository.save(attendance);
                });

        return mapToResponse(permissionRequestRepository.save(permission));
    }

    @Override
    @Transactional
    public PermissionRequestResponse rejectPermission(Long permissionId, Long managerId, String remarks) {
        PermissionRequest permission = permissionRequestRepository.findById(permissionId)
                .orElseThrow(() -> new ResourceNotFoundException("Permission request not found."));
        Employee manager = getEmployeeOrThrow(managerId);

        if (!"Pending".equals(permission.getStatus())) {
            throw new IllegalArgumentException("Permission request is already " + permission.getStatus());
        }

        permission.setStatus("Rejected");
        permission.setApprovedBy(manager);
        permission.setRemarks(remarks);

        return mapToResponse(permissionRequestRepository.save(permission));
    }

    private Employee getEmployeeOrThrow(Long id) {
        return employeeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Employee not found with id " + id));
    }

    private PermissionRequestResponse mapToResponse(PermissionRequest p) {
        Employee employee = p.getEmployee();
        String employeeName = employee != null
            ? (employee.getFirstName() + " " + employee.getLastName())
            : "Unknown Employee";
        return PermissionRequestResponse.builder()
                .id(p.getId())
            .employeeId(employee != null ? employee.getId() : null)
            .employeeName(employeeName)
                .date(p.getDate())
                .startTime(p.getStartTime())
                .endTime(p.getEndTime())
                .totalHours(p.getTotalHours())
                .reason(p.getReason())
                .remarks(p.getRemarks())
                .status(p.getStatus())
                .approvedByName(p.getApprovedBy() != null
                        ? p.getApprovedBy().getFirstName() + " " + p.getApprovedBy().getLastName()
                        : null)
                .createdAt(p.getCreatedAt())
                .build();
    }
}
