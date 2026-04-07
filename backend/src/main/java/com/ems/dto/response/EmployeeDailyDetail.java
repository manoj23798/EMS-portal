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
public class EmployeeDailyDetail {
    private String employeeName;
    private String project;
    private Double amount;
    private Map<String, Double> breakdown;
    private String status;
}
