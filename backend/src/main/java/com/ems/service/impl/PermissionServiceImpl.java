package com.ems.service.impl;

import com.ems.dto.request.PermissionApplyRequest;
import com.ems.dto.response.PermissionRequestResponse;
import com.ems.entity.Attendance;
import com.ems.entity.Employee;
import com.ems.entity.PermissionRequest;
import com.ems.repository.AttendanceRepository;
import com.ems.repository.EmployeeRepository;
import com.ems.repository.PermissionRequestRepository;
import com.ems.service.PermissionService;
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
            throw new RuntimeException("End time must be after start time.");
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
    @Transactional
    public PermissionRequestResponse approvePermission(Long permissionId, Long managerId) {
        PermissionRequest permission = permissionRequestRepository.findById(permissionId)
                .orElseThrow(() -> new RuntimeException("Permission request not found."));
        Employee manager = getEmployeeOrThrow(managerId);

        if (!"Pending".equals(permission.getStatus())) {
            throw new RuntimeException("Permission request is already " + permission.getStatus());
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
    public PermissionRequestResponse rejectPermission(Long permissionId, Long managerId) {
        PermissionRequest permission = permissionRequestRepository.findById(permissionId)
                .orElseThrow(() -> new RuntimeException("Permission request not found."));
        Employee manager = getEmployeeOrThrow(managerId);

        if (!"Pending".equals(permission.getStatus())) {
            throw new RuntimeException("Permission request is already " + permission.getStatus());
        }

        permission.setStatus("Rejected");
        permission.setApprovedBy(manager);

        return mapToResponse(permissionRequestRepository.save(permission));
    }

    private Employee getEmployeeOrThrow(Long id) {
        return employeeRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Employee not found with id " + id));
    }

    private PermissionRequestResponse mapToResponse(PermissionRequest p) {
        return PermissionRequestResponse.builder()
                .id(p.getId())
                .employeeId(p.getEmployee().getId())
                .employeeName(p.getEmployee().getFirstName() + " " + p.getEmployee().getLastName())
                .date(p.getDate())
                .startTime(p.getStartTime())
                .endTime(p.getEndTime())
                .totalHours(p.getTotalHours())
                .reason(p.getReason())
                .status(p.getStatus())
                .approvedByName(p.getApprovedBy() != null ?
                        p.getApprovedBy().getFirstName() + " " + p.getApprovedBy().getLastName() : null)
                .createdAt(p.getCreatedAt())
                .build();
    }
}
