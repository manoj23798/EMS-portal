package com.ems.controller.Reimbursement;

import com.ems.dto.request.ReimbursementRequest;
import com.ems.dto.response.ReimbursementResponse;
import com.ems.service.Interface.ReimbursementService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/reimbursement")
@CrossOrigin(origins = "*", maxAge = 3600)
public class ReimbursementController {

    @Autowired
    private ReimbursementService reimbursementService;

    @PostMapping("/create")
    @PreAuthorize("hasAnyAuthority('EMPLOYEE', 'MANAGER', 'HR', 'ADMIN', 'PROJECT_MANAGER', 'IT_MANAGER')")
    public ResponseEntity<ReimbursementResponse> submitReimbursement(@Valid @RequestBody ReimbursementRequest request) {
        return ResponseEntity.ok(reimbursementService.submitReimbursement(request));
    }

    @GetMapping("/my")
    @PreAuthorize("hasAnyAuthority('EMPLOYEE', 'MANAGER', 'HR', 'ADMIN', 'PROJECT_MANAGER', 'IT_MANAGER')")
    public ResponseEntity<List<ReimbursementResponse>> getMyReimbursements() {
        return ResponseEntity.ok(reimbursementService.getMyReimbursements());
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyAuthority('EMPLOYEE', 'MANAGER', 'HR', 'ADMIN', 'PROJECT_MANAGER', 'IT_MANAGER')")
    public ResponseEntity<ReimbursementResponse> getReimbursementById(@PathVariable("id") Long id) {
        return ResponseEntity.ok(reimbursementService.getReimbursementById(id));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyAuthority('EMPLOYEE', 'MANAGER', 'HR', 'ADMIN', 'PROJECT_MANAGER', 'IT_MANAGER')")
    public ResponseEntity<Void> deleteReimbursement(@PathVariable("id") Long id) {
        reimbursementService.deleteReimbursement(id);
        return ResponseEntity.noContent().build();
    }
}
