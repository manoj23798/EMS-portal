package com.ems.service;

import com.ems.dto.request.LeaveApplyRequest;
import com.ems.dto.response.LeaveBalanceResponse;
import com.ems.dto.response.LeaveRequestResponse;

import java.util.List;

public interface LeaveService {

    LeaveRequestResponse applyLeave(LeaveApplyRequest request);

    List<LeaveRequestResponse> getMyLeaves(Long employeeId);

    List<LeaveBalanceResponse> getMyBalance(Long employeeId);

    List<LeaveRequestResponse> getPendingRequests();

    List<LeaveRequestResponse> getAllLeaves();

    LeaveRequestResponse approveLeave(Long leaveId, Long managerId, String remarks);

    LeaveRequestResponse rejectLeave(Long leaveId, Long managerId, String remarks);
}
