package com.ems.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.Map;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class DailyClaimSummaryDTO {
    private String type; // RED (HR Payout), GREEN (Emp Return), GREY (Pending)
    private Double amount;
    private Map<String, Double> breakdown;
    private java.util.List<EmployeeDailyDetail> details;
}
