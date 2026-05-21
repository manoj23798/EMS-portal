package com.ems.controller.Performance;

import com.ems.entity.Performance.MonthlyPerformanceReview;
import com.ems.entity.Performance.PerformanceTemplate;
import com.ems.entity.Performance.ServiceRegister;
import com.ems.service.Interface.Performance.PerformanceService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/performance")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class PerformanceController {

    private final PerformanceService performanceService;
    private final com.ems.repository.Employee.UserRepository userRepository;

    // --- Dashboard ---
    @GetMapping("/dashboard")
    @PreAuthorize("hasAnyAuthority('ADMIN', 'HR', 'PROJECT_MANAGER')")
    public ResponseEntity<Map<String, Object>> getDashboardStats() {
        return ResponseEntity.ok(performanceService.getDashboardStats());
    }

    // --- Templates ---
    @PostMapping("/templates")
    @PreAuthorize("hasAnyAuthority('ADMIN', 'HR')")
    public ResponseEntity<PerformanceTemplate> createTemplate(@RequestBody PerformanceTemplate template) {
        return ResponseEntity.ok(performanceService.createTemplate(template));
    }

    @PutMapping("/templates/{id}")
    @PreAuthorize("hasAnyAuthority('ADMIN', 'HR')")
    public ResponseEntity<PerformanceTemplate> updateTemplate(@PathVariable Long id, @RequestBody PerformanceTemplate template) {
        return ResponseEntity.ok(performanceService.updateTemplate(id, template));
    }

    @GetMapping("/templates")
    @PreAuthorize("hasAnyAuthority('ADMIN', 'HR', 'PROJECT_MANAGER')")
    public ResponseEntity<List<PerformanceTemplate>> getAllTemplates() {
        return ResponseEntity.ok(performanceService.getAllTemplates());
    }

    @GetMapping("/templates/{id}")
    @PreAuthorize("hasAnyAuthority('ADMIN', 'HR', 'PROJECT_MANAGER')")
    public ResponseEntity<PerformanceTemplate> getTemplateById(@PathVariable Long id) {
        return ResponseEntity.ok(performanceService.getTemplateById(id));
    }

    @DeleteMapping("/templates/{id}")
    @PreAuthorize("hasAnyAuthority('ADMIN', 'HR')")
    public ResponseEntity<Void> deleteTemplate(@PathVariable Long id) {
        performanceService.deleteTemplate(id);
        return ResponseEntity.noContent().build();
    }

    // --- MPRs ---
    @PostMapping("/reviews")
    @PreAuthorize("hasAnyAuthority('ADMIN', 'HR', 'PROJECT_MANAGER')")
    public ResponseEntity<MonthlyPerformanceReview> createMPR(@RequestBody MonthlyPerformanceReview mpr) {
        return ResponseEntity.ok(performanceService.createMPR(mpr));
    }

    @PutMapping("/reviews/{id}")
    @PreAuthorize("hasAnyAuthority('ADMIN', 'HR', 'PROJECT_MANAGER')")
    public ResponseEntity<MonthlyPerformanceReview> updateMPR(@PathVariable Long id, @RequestBody MonthlyPerformanceReview mpr) {
        return ResponseEntity.ok(performanceService.updateMPR(id, mpr));
    }

    @GetMapping("/reviews")
    @PreAuthorize("hasAnyAuthority('ADMIN', 'HR', 'PROJECT_MANAGER', 'EMPLOYEE')")
    public ResponseEntity<List<MonthlyPerformanceReview>> getAllMPRs(java.security.Principal principal) {
        com.ems.entity.Employee.User user = userRepository.findByUsername(principal.getName())
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        String role = user.getRole().getRoleName();
        if ("ADMIN".equals(role) || "HR".equals(role)) {
            return ResponseEntity.ok(performanceService.getAllMPRs());
        } else if ("PROJECT_MANAGER".equals(role)) {
            return ResponseEntity.ok(performanceService.getMPRsByManager(user.getEmployee().getId()));
        } else {
            return ResponseEntity.ok(performanceService.getMPRsByEmployee(user.getEmployee().getId()));
        }
    }

    @GetMapping("/reviews/employee/{employeeId}")
    @PreAuthorize("hasAnyAuthority('ADMIN', 'HR', 'PROJECT_MANAGER', 'EMPLOYEE')")
    public ResponseEntity<List<MonthlyPerformanceReview>> getMPRsByEmployee(@PathVariable Long employeeId, java.security.Principal principal) {
        com.ems.entity.Employee.User user = userRepository.findByUsername(principal.getName())
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        String role = user.getRole().getRoleName();
        if ("EMPLOYEE".equals(role) && !user.getEmployee().getId().equals(employeeId)) {
            return ResponseEntity.status(org.springframework.http.HttpStatus.FORBIDDEN).build();
        }
        // PM logic could be added here to check team membership
        
        return ResponseEntity.ok(performanceService.getMPRsByEmployee(employeeId));
    }
    
    @GetMapping("/reviews/{id}")
    @PreAuthorize("hasAnyAuthority('ADMIN', 'HR', 'PROJECT_MANAGER', 'EMPLOYEE')")
    public ResponseEntity<MonthlyPerformanceReview> getMPRById(@PathVariable Long id) {
        return ResponseEntity.ok(performanceService.getMPRById(id));
    }

    // --- Service Register ---
    @PostMapping("/service-register")
    @PreAuthorize("hasAnyAuthority('ADMIN', 'HR', 'PROJECT_MANAGER')")
    public ResponseEntity<ServiceRegister> createServiceRegister(@RequestBody ServiceRegister entry) {
        return ResponseEntity.ok(performanceService.createServiceRegister(entry));
    }

    @PutMapping("/service-register/{id}")
    @PreAuthorize("hasAnyAuthority('ADMIN', 'HR', 'PROJECT_MANAGER')")
    public ResponseEntity<ServiceRegister> updateServiceRegister(@PathVariable Long id, @RequestBody ServiceRegister entry) {
        return ResponseEntity.ok(performanceService.updateServiceRegister(id, entry));
    }

    @GetMapping("/service-register")
    @PreAuthorize("hasAnyAuthority('ADMIN', 'HR', 'PROJECT_MANAGER', 'EMPLOYEE')")
    public ResponseEntity<List<ServiceRegister>> getAllServiceRegisters(java.security.Principal principal) {
        com.ems.entity.Employee.User user = userRepository.findByUsername(principal.getName())
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        String role = user.getRole().getRoleName();
        if ("ADMIN".equals(role) || "HR".equals(role)) {
            return ResponseEntity.ok(performanceService.getAllServiceRegisters());
        } else if ("PROJECT_MANAGER".equals(role)) {
            // For PMs, we currently show all or could filter by team
            return ResponseEntity.ok(performanceService.getAllServiceRegisters());
        } else {
            // For employees, only show their own service records
            return ResponseEntity.ok(performanceService.getServiceRegistersByEmployee(user.getEmployee().getId()));
        }
    }

    @GetMapping("/service-register/employee/{employeeId}")
    @PreAuthorize("hasAnyAuthority('ADMIN', 'HR', 'PROJECT_MANAGER', 'EMPLOYEE')")
    public ResponseEntity<List<ServiceRegister>> getServiceRegistersByEmployee(@PathVariable Long employeeId) {
        return ResponseEntity.ok(performanceService.getServiceRegistersByEmployee(employeeId));
    }

    @DeleteMapping("/service-register/{id}")
    @PreAuthorize("hasAnyAuthority('ADMIN', 'HR')")
    public ResponseEntity<Void> deleteServiceRegister(@PathVariable Long id) {
        performanceService.deleteServiceRegister(id);
        return ResponseEntity.noContent().build();
    }
}
