package com.ems.controller.Leave;

import com.ems.dto.request.LeaveApplyRequest;
import com.ems.dto.request.LeaveCancelRequest;
import com.ems.dto.response.LeaveBalanceResponse;
import com.ems.dto.response.LeaveRequestResponse;
import com.ems.service.Interface.LeaveService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class LeaveController {

    private final LeaveService leaveService;

    // ===================== EMPLOYEE ENDPOINTS =====================

    @PostMapping("/leaves/apply")
    public ResponseEntity<LeaveRequestResponse> applyLeave(@Valid @RequestBody LeaveApplyRequest request) {
        return ResponseEntity.ok(leaveService.applyLeave(request));
    }

    @GetMapping("/leaves/my")
    public ResponseEntity<List<LeaveRequestResponse>> getMyLeaves(@RequestParam("employeeId") Long employeeId) {
        return ResponseEntity.ok(leaveService.getMyLeaves(employeeId));
    }

    @GetMapping("/leaves/balance")
    public ResponseEntity<List<LeaveBalanceResponse>> getMyBalance(@RequestParam("employeeId") Long employeeId) {
        return ResponseEntity.ok(leaveService.getMyBalance(employeeId));
    }

    @PutMapping("/leaves/{id}/cancel")
    public ResponseEntity<LeaveRequestResponse> cancelLeave(
            @PathVariable("id") Long id,
            @RequestParam("employeeId") Long employeeId,
            @Valid @RequestBody LeaveCancelRequest request) {
        return ResponseEntity.ok(leaveService.cancelLeave(id, employeeId, request.getCancelReason()));
    }

    // ===================== MANAGER ENDPOINTS =====================

    @GetMapping("/manager/leaves")
    public ResponseEntity<List<LeaveRequestResponse>> getAllManagerLeaves() {
        return ResponseEntity.ok(leaveService.getAllLeaves());
    }

    @PutMapping("/manager/leaves/{id}/approve")
    public ResponseEntity<LeaveRequestResponse> approveLeave(
            @PathVariable("id") Long id,
            @RequestParam("managerId") Long managerId,
            @RequestParam(required = false) String remarks) {
        return ResponseEntity.ok(leaveService.approveLeave(id, managerId, remarks));
    }

    @PutMapping("/manager/leaves/{id}/reject")
    public ResponseEntity<LeaveRequestResponse> rejectLeave(
            @PathVariable("id") Long id,
            @RequestParam("managerId") Long managerId,
            @RequestParam(required = false) String remarks) {
        return ResponseEntity.ok(leaveService.rejectLeave(id, managerId, remarks));
    }

    // ===================== ADMIN ENDPOINTS =====================

    @GetMapping("/admin/leaves")
    public ResponseEntity<List<LeaveRequestResponse>> getAllLeaves() {
        return ResponseEntity.ok(leaveService.getAllLeaves());
    }
}
