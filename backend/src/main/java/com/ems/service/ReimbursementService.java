package com.ems.service;

import com.ems.dto.request.ReimbursementRequest;
import com.ems.dto.response.ReimbursementResponse;
import java.util.List;

public interface ReimbursementService {
    ReimbursementResponse submitReimbursement(ReimbursementRequest request);
    List<ReimbursementResponse> getMyReimbursements();
    List<ReimbursementResponse> getAllPendingForManager();
    List<ReimbursementResponse> getAllForAccounts();
    ReimbursementResponse getReimbursementById(Long id);
    ReimbursementResponse managerApproveOrReject(Long id, boolean approve);
    ReimbursementResponse accountsSettle(Long id, Double approvedAmount, String reason);
}
