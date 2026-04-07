package com.ems.dto.response;

import lombok.Builder;
import lombok.Data;
import java.util.List;
import java.util.Map;

@Data
@Builder
public class AnalyticsResponse {
    private Double totalExpenditure;
    private Integer totalRequests;
    private Double approvedPayout;
    private Integer pendingReviewCount;
    private Double pendingAuditAmount;
    private Integer approvedCount;
    private Integer rejectedCount;

    private Map<String, Double> categoryBreakdown;
    private Map<String, Double> monthlyTrend;
    private Map<String, Long> statusDistribution;
    private Map<String, Double> statusAmountDistribution;
    private Map<String, Map<Integer, Double>> dailyTrend; // MonthKey -> {Day: Amount}
    
    private List<ClaimTableDTO> claims;
    private List<AuditLogDTO> auditLogs;
    private List<BudgetUtilizationDTO> budgetUtilization;
    private Map<String, DailyClaimSummaryDTO> calendarData;

    @Data
    @Builder
    public static class SummaryStats {
        private Double totalAmount;
        private Long totalRequests;
        private Double approvedAmount;
        private Double pendingAmount;
        private Double rejectedAmount;
        private Double settledAmount;
    }

    @Data
    @Builder
    public static class CategoryData {
        private String category;
        private Double amount;
    }

    @Data
    @Builder
    public static class TrendData {
        private String month;
        private Double amount;
    }

    @Data
    @Builder
    public static class StatusData {
        private String status;
        private Long count;
    }
}
