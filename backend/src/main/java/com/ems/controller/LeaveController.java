package com.ems.controller;

import com.ems.dto.request.LeaveApplyRequest;
import com.ems.dto.response.LeaveBalanceResponse;
import com.ems.dto.response.LeaveRequestResponse;
import com.ems.service.LeaveService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:5173")
public class LeaveController {

    private final LeaveService leaveService;

    // ===================== EMPLOYEE ENDPOINTS =====================

    @PostMapping("/leaves/apply")
    public ResponseEntity<LeaveRequestResponse> applyLeave(@Valid @RequestBody LeaveApplyRequest request) {
        return ResponseEntity.ok(leaveService.applyLeave(request));
    }

    @GetMapping("/leaves/my")
    public ResponseEntity<List<LeaveRequestResponse>> getMyLeaves(@RequestParam Long employeeId) {
        return ResponseEntity.ok(leaveService.getMyLeaves(employeeId));
    }

    @GetMapping("/leaves/balance")
    public ResponseEntity<List<LeaveBalanceResponse>> getMyBalance(@RequestParam Long employeeId) {
        return ResponseEntity.ok(leaveService.getMyBalance(employeeId));
    }

    // ===================== MANAGER ENDPOINTS =====================

    @GetMapping("/manager/leaves")
    public ResponseEntity<List<LeaveRequestResponse>> getPendingLeaves() {
        return ResponseEntity.ok(leaveService.getPendingRequests());
    }

    @PutMapping("/manager/leaves/{id}/approve")
    public ResponseEntity<LeaveRequestResponse> approveLeave(
            @PathVariable Long id,
            @RequestParam Long managerId,
            @RequestParam(required = false) String remarks) {
        return ResponseEntity.ok(leaveService.approveLeave(id, managerId, remarks));
    }

    @PutMapping("/manager/leaves/{id}/reject")
    public ResponseEntity<LeaveRequestResponse> rejectLeave(
            @PathVariable Long id,
            @RequestParam Long managerId,
            @RequestParam(required = false) String remarks) {
        return ResponseEntity.ok(leaveService.rejectLeave(id, managerId, remarks));
    }

    // ===================== ADMIN ENDPOINTS =====================

    @GetMapping("/admin/leaves")
    public ResponseEntity<List<LeaveRequestResponse>> getAllLeaves() {
        return ResponseEntity.ok(leaveService.getAllLeaves());
    }
}
