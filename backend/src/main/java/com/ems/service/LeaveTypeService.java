package com.ems.service;

import com.ems.entity.LeaveType;
import java.util.List;

public interface LeaveTypeService {
    List<LeaveType> getAllLeaveTypes();
    LeaveType getLeaveTypeById(Long id);
    LeaveType createLeaveType(LeaveType leaveType);
    LeaveType updateLeaveType(Long id, LeaveType leaveType);
    void deleteLeaveType(Long id);
}
