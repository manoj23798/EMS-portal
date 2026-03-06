package com.ems.service;

import com.ems.dto.request.PermissionApplyRequest;
import com.ems.dto.response.PermissionRequestResponse;

import java.util.List;

public interface PermissionService {

    PermissionRequestResponse applyPermission(PermissionApplyRequest request);

    List<PermissionRequestResponse> getMyPermissions(Long employeeId);

    List<PermissionRequestResponse> getPendingPermissions();

    PermissionRequestResponse approvePermission(Long permissionId, Long managerId);

    PermissionRequestResponse rejectPermission(Long permissionId, Long managerId);
}
