package com.ems.controller;

import com.ems.dto.request.ReimbursementRequest;
import com.ems.dto.response.ReimbursementResponse;
import com.ems.service.ReimbursementService;
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
    @PreAuthorize("hasAnyRole('EMPLOYEE', 'MANAGER', 'HR', 'ADMIN', 'PROJECT_MANAGER', 'IT_MANAGER')")
    public ResponseEntity<ReimbursementResponse> submitReimbursement(@Valid @RequestBody ReimbursementRequest request) {
        return ResponseEntity.ok(reimbursementService.submitReimbursement(request));
    }

    @GetMapping("/my")
    @PreAuthorize("hasAnyRole('EMPLOYEE', 'MANAGER', 'HR', 'ADMIN', 'PROJECT_MANAGER', 'IT_MANAGER')")
    public ResponseEntity<List<ReimbursementResponse>> getMyReimbursements() {
        return ResponseEntity.ok(reimbursementService.getMyReimbursements());
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('EMPLOYEE', 'MANAGER', 'HR', 'ADMIN', 'PROJECT_MANAGER', 'IT_MANAGER')")
    public ResponseEntity<ReimbursementResponse> getReimbursementById(@PathVariable Long id) {
        return ResponseEntity.ok(reimbursementService.getReimbursementById(id));
    }
}
