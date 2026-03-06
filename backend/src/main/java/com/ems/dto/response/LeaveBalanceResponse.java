package com.ems.dto.response;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class LeaveBalanceResponse {
    private Long id;
    private String leaveType;
    private Integer totalLeaves;
    private Integer usedLeaves;
    private Integer remainingLeaves;
    private Integer year;
}
