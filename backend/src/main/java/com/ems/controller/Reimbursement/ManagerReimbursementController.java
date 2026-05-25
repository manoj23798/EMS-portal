package com.ems.controller.Reimbursement;

import com.ems.dto.response.ReimbursementResponse;
import com.ems.service.Interface.ReimbursementService;
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
            @PathVariable("id") Long id,
            @RequestBody Map<String, Object> payload) {
        boolean approve = Boolean.TRUE.equals(payload.get("approve"));
        String remarks = (String) payload.get("remarks");
        return ResponseEntity.ok(reimbursementService.managerApproveOrReject(id, approve, remarks));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('MANAGER', 'PROJECT_MANAGER', 'IT_MANAGER', 'HR', 'ADMIN')")
    public ResponseEntity<ReimbursementResponse> getReimbursementById(@PathVariable("id") Long id) {
        return ResponseEntity.ok(reimbursementService.getReimbursementById(id));
    }
}
