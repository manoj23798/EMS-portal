package com.ems.dto.response;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class LeaveBalanceResponse {
    private Long id;
    private String leaveType;
    private Double totalLeaves;
    private Double usedLeaves;
    private Double remainingLeaves;
    private Integer year;
}
