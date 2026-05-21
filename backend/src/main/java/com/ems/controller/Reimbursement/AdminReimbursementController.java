package com.ems.controller.Reimbursement;

import com.ems.dto.response.ReimbursementResponse;
import com.ems.service.Interface.ReimbursementService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/admin/reimbursement")
@CrossOrigin(origins = "*", maxAge = 3600)
public class AdminReimbursementController {

    @Autowired
    private ReimbursementService reimbursementService;

    @PutMapping("/{id}/settle")
    @PreAuthorize("hasAnyRole('HR', 'ADMIN')")
    public ResponseEntity<ReimbursementResponse> settleReimbursement(
            @PathVariable("id") Long id,
            @RequestBody Map<String, Object> payload) {
        
        Double approvedAmount = null;
        if (payload.containsKey("approvedAmount") && payload.get("approvedAmount") != null) {
            approvedAmount = Double.valueOf(payload.get("approvedAmount").toString());
        }
        String reason = (String) payload.get("reason");
        
        // Robust boolean parsing
        Boolean approve = true;
        Object approveObj = payload.get("approve");
        if (approveObj != null) {
            if (approveObj instanceof Boolean) {
                approve = (Boolean) approveObj;
            } else {
                approve = Boolean.parseBoolean(approveObj.toString());
            }
        }

        return ResponseEntity.ok(reimbursementService.accountsSettle(id, approvedAmount, reason, approve));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('HR', 'ADMIN')")
    public ResponseEntity<ReimbursementResponse> getReimbursementById(@PathVariable("id") Long id) {
        return ResponseEntity.ok(reimbursementService.getReimbursementById(id));
    }
}
