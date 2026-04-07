package com.ems.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class BudgetUtilizationDTO {
    private String departmentName;
    private Double actualSpending;
    private Double budgetLimit;
    private Double utilizationPercentage;
}
