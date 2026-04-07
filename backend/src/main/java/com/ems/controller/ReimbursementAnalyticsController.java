package com.ems.controller;

import com.ems.dto.response.AnalyticsResponse;
import com.ems.entity.Employee;
import com.ems.repository.EmployeeRepository;
import com.ems.repository.ReimbursementMasterRepository;
import com.ems.service.impl.ReimbursementAnalyticsService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/admin/reimbursements/analytics")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class ReimbursementAnalyticsController {

    private final ReimbursementAnalyticsService analyticsService;
    private final EmployeeRepository employeeRepository;
    private final ReimbursementMasterRepository masterRepository;

    @GetMapping("/dashboard")
    public ResponseEntity<AnalyticsResponse> getDashboard(
            @RequestParam(required = false) Long employeeId,
            @RequestParam(required = false) String project,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String dateFrom,
            @RequestParam(required = false) String dateTo) {
        
        return ResponseEntity.ok(analyticsService.getDashboardAnalytics(employeeId, project, status, dateFrom, dateTo));
    }

    @GetMapping("/filters/employees")
    public ResponseEntity<List<Employee>> getFilterEmployees() {
        return ResponseEntity.ok(employeeRepository.findAll());
    }

    @GetMapping("/filters/projects")
    public ResponseEntity<List<String>> getFilterProjects() {
        List<String> reasons = masterRepository.findAll().stream()
                .map(c -> c.getReasonForTravel())
                .filter(r -> r != null && !r.isEmpty())
                .distinct()
                .collect(Collectors.toList());
        return ResponseEntity.ok(reasons);
    }
}
