package com.ems.controller;

import com.ems.dto.request.PermissionApplyRequest;
import com.ems.dto.response.PermissionRequestResponse;
import com.ems.service.PermissionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class PermissionController {

    private final PermissionService permissionService;

    // ===================== EMPLOYEE ENDPOINTS =====================

    @PostMapping("/permissions/apply")
    public ResponseEntity<PermissionRequestResponse> applyPermission(
            @Valid @RequestBody PermissionApplyRequest request) {
        return ResponseEntity.ok(permissionService.applyPermission(request));
    }

    @GetMapping("/permissions/my")
    public ResponseEntity<List<PermissionRequestResponse>> getMyPermissions(@RequestParam("employeeId") Long employeeId) {
        return ResponseEntity.ok(permissionService.getMyPermissions(employeeId));
    }

    // ===================== MANAGER ENDPOINTS =====================

    @GetMapping("/manager/permissions")
    public ResponseEntity<List<PermissionRequestResponse>> getPendingPermissions() {
        return ResponseEntity.ok(permissionService.getPendingPermissions());
    }

    @PutMapping("/manager/permissions/{id}/approve")
    public ResponseEntity<PermissionRequestResponse> approvePermission(
            @PathVariable("id") Long id,
            @RequestParam("managerId") Long managerId) {
        return ResponseEntity.ok(permissionService.approvePermission(id, managerId));
    }

    @PutMapping("/manager/permissions/{id}/reject")
    public ResponseEntity<PermissionRequestResponse> rejectPermission(
            @PathVariable("id") Long id,
            @RequestParam("managerId") Long managerId) {
        return ResponseEntity.ok(permissionService.rejectPermission(id, managerId));
    }

    // ===================== ADMIN ENDPOINTS =====================

    @GetMapping("/admin/permissions")
    public ResponseEntity<List<PermissionRequestResponse>> getAllPermissions() {
        return ResponseEntity.ok(permissionService.getAllPermissions());
    }
}
