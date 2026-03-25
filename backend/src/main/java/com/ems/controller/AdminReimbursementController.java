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
@RequestMapping("/api/admin/reimbursement")
@CrossOrigin(origins = "*", maxAge = 3600)
public class AdminReimbursementController {

    @Autowired
    private ReimbursementService reimbursementService;

    @GetMapping("/all")
    @PreAuthorize("hasAnyRole('HR', 'ADMIN')")
    public ResponseEntity<List<ReimbursementResponse>> getAllReimbursements() {
        return ResponseEntity.ok(reimbursementService.getAllForAccounts());
    }

    @PutMapping("/{id}/settle")
    @PreAuthorize("hasAnyRole('HR', 'ADMIN')")
    public ResponseEntity<ReimbursementResponse> settleReimbursement(
            @PathVariable Long id,
            @RequestBody Map<String, Object> payload) {
        
        Double approvedAmount = null;
        if (payload.containsKey("approvedAmount") && payload.get("approvedAmount") != null) {
            approvedAmount = Double.valueOf(payload.get("approvedAmount").toString());
        }
        String reason = (String) payload.get("reason");

        return ResponseEntity.ok(reimbursementService.accountsSettle(id, approvedAmount, reason));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('HR', 'ADMIN')")
    public ResponseEntity<ReimbursementResponse> getReimbursementById(@PathVariable Long id) {
        return ResponseEntity.ok(reimbursementService.getReimbursementById(id));
    }
}
