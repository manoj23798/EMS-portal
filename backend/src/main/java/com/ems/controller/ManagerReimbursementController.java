package com.ems.controller;

import com.ems.dto.response.ReimbursementResponse;
import com.ems.service.ReimbursementService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/manager/reimbursement")
@CrossOrigin(origins = "*", maxAge = 3600)
public class ManagerReimbursementController {

    @Autowired
    private ReimbursementService reimbursementService;

    @GetMapping("/pending")
    @PreAuthorize("hasAnyRole('MANAGER', 'PROJECT_MANAGER', 'IT_MANAGER', 'HR', 'ADMIN')")
    public ResponseEntity<List<ReimbursementResponse>> getPendingReimbursements() {
        return ResponseEntity.ok(reimbursementService.getAllPendingForManager());
    }

    @PutMapping("/{id}/approve")
    @PreAuthorize("hasAnyRole('MANAGER', 'PROJECT_MANAGER', 'IT_MANAGER', 'HR', 'ADMIN')")
    public ResponseEntity<ReimbursementResponse> approveOrRejectReimbursement(
            @PathVariable Long id,
            @RequestBody Map<String, Boolean> payload) {
        boolean approve = payload.getOrDefault("approve", false);
        return ResponseEntity.ok(reimbursementService.managerApproveOrReject(id, approve));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('MANAGER', 'PROJECT_MANAGER', 'IT_MANAGER', 'HR', 'ADMIN')")
    public ResponseEntity<ReimbursementResponse> getReimbursementById(@PathVariable Long id) {
        return ResponseEntity.ok(reimbursementService.getReimbursementById(id));
    }
}
