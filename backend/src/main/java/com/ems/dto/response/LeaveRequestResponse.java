package com.ems.dto.response;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Builder
public class LeaveRequestResponse {
    private Long id;
    private Long employeeId;
    private String employeeName;
    private LocalDate joiningDate;
    private String leaveType;
    private String leaveTypeColor;
    private boolean isLop;
    private LocalDate startDate;
    private LocalDate endDate;
    private Double totalDays;
    private String reason;
    private String attachmentUrl;
    private String status;
    private String approvedByName;
    private String designation;
    private String department;
    private String remarks;
    private String cancelReason;
    private Double lopCount;
    private Double leaveBalance;
    private String profilePhotoUrl;
    private LocalDateTime createdAt;
}
