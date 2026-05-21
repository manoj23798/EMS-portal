package com.ems.controller.Employee;

import com.ems.entity.Employee.Employee;
import com.ems.entity.Employee.ExitManagement;
import com.ems.entity.Employee.User;
import com.ems.repository.Employee.EmployeeRepository;
import com.ems.repository.Employee.ExitManagementRepository;
import com.ems.repository.Employee.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.Map;

@RestController
@RequestMapping("/api/exit")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class ExitController {

    private final ExitManagementRepository exitManagementRepository;
    private final EmployeeRepository employeeRepository;
    private final UserRepository userRepository;

    private boolean isAuthorized(Long employeeId, Principal principal) {
        User user = userRepository.findByUsername(principal.getName())
                .orElseThrow(() -> new RuntimeException("User not found"));
        String role = user.getRole().getRoleName();
        if ("ADMIN".equals(role) || "HR".equals(role)) return true;
        return user.getEmployee() != null && user.getEmployee().getId().equals(employeeId);
    }

    @GetMapping("/{employeeId}")
    @PreAuthorize("hasAnyAuthority('ADMIN', 'HR', 'EMPLOYEE')")
    public ResponseEntity<ExitManagement> getExit(@PathVariable Long employeeId, Principal principal) {
        if (!isAuthorized(employeeId, principal)) return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        return ResponseEntity.ok(exitManagementRepository.findByEmployeeId(employeeId).orElse(null));
    }

    @PostMapping("/{employeeId}")
    @PreAuthorize("hasAnyAuthority('ADMIN', 'HR')")
    public ResponseEntity<ExitManagement> saveExit(@PathVariable Long employeeId, @RequestBody Map<String, Object> data) {
        Employee employee = employeeRepository.findById(employeeId)
                .orElseThrow(() -> new RuntimeException("Employee not found"));
        
        ExitManagement exit = exitManagementRepository.findByEmployeeId(employeeId)
                .orElse(new ExitManagement());
        exit.setEmployee(employee);
        exit.setExitData(data);
        
        return ResponseEntity.ok(exitManagementRepository.save(exit));
    }
}
