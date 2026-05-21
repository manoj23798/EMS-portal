package com.ems.service.implementation;

import com.ems.dto.response.*;
import com.ems.entity.Reimbursement.ReimbursementMaster;
import com.ems.repository.Reimbursement.ReimbursementMasterRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ReimbursementAnalyticsService {

    private final ReimbursementMasterRepository reimbursementMasterRepository;

    public AnalyticsResponse getDashboardAnalytics(Long employeeId, String project, String status, String dateFrom, String dateTo) {
        List<ReimbursementMaster> allClaims = reimbursementMasterRepository.findAll();

        // 1. Core Filtering
        LocalDate start = (dateFrom != null && !dateFrom.isEmpty()) ? LocalDate.parse(dateFrom) : null;
        LocalDate end = (dateTo != null && !dateTo.isEmpty()) ? LocalDate.parse(dateTo) : null;

        List<ReimbursementMaster> filtered = allClaims.stream()
                .filter(c -> employeeId == null || c.getEmployee().getId().equals(employeeId))
                .filter(c -> project == null || project.isEmpty() || (c.getReasonForTravel() != null && c.getReasonForTravel().equalsIgnoreCase(project)))
                .filter(c -> status == null || status.equals("ALL") || c.getStatus().equals(status))
                .filter(c -> {
                    if (c.getSubmissionDate() == null) return true;
                    if (start != null && c.getSubmissionDate().isBefore(start)) return false;
                    if (end != null && c.getSubmissionDate().isAfter(end)) return false;
                    return true;
                })
                .collect(Collectors.toList());
        
        // 1b. Date-Independent Filtering (for Calendar and Trend)
        List<ReimbursementMaster> dateIndependentFiltered = allClaims.stream()
                .filter(c -> employeeId == null || c.getEmployee().getId().equals(employeeId))
                .filter(c -> project == null || project.isEmpty() || (c.getReasonForTravel() != null && c.getReasonForTravel().equalsIgnoreCase(project)))
                .filter(c -> status == null || status.equals("ALL") || c.getStatus().equals(status))
                .collect(Collectors.toList());

        // 2. Summary Stats
        double totalExpenditure = filtered.stream()
                .mapToDouble(c -> c.getTotalAmountClaimed() != null ? c.getTotalAmountClaimed() : 0.0).sum();
        
        double approvedPayout = filtered.stream()
                .filter(c -> "APPROVED".equals(c.getStatus()) || "ACCOUNTS_SETTLED".equals(c.getStatus()) || "MANAGER_APPROVED".equals(c.getStatus()))
                .mapToDouble(c -> c.getTotalAmountClaimed() != null ? c.getTotalAmountClaimed() : 0.0).sum();

        int pendingReviewCount = (int) filtered.stream()
                .filter(c -> "PENDING".equals(c.getStatus())).count();

        int approvedCount = (int) filtered.stream()
                .filter(c -> "APPROVED".equals(c.getStatus()) || "ACCOUNTS_SETTLED".equals(c.getStatus()) || "MANAGER_APPROVED".equals(c.getStatus()))
                .count();

        int rejectedCount = (int) filtered.stream()
                .filter(c -> "REJECTED".equals(c.getStatus()))
                .count();

        double pendingAuditAmount = filtered.stream()
                .filter(c -> "PENDING".equals(c.getStatus()))
                .mapToDouble(c -> c.getTotalAmountClaimed() != null ? c.getTotalAmountClaimed() : 0.0).sum();

        // 3. Category Distribution
        Map<String, Double> catMap = new HashMap<>();
        filtered.forEach(c -> {
            catMap.merge("Tickets", c.getTickets().stream().mapToDouble(t -> t.getAmount() != null ? t.getAmount() : 0.0).sum(), (a, b) -> a + b);
            catMap.merge("Food", c.getFoods().stream().mapToDouble(f -> f.getTotal() != null ? f.getTotal() : 0.0).sum(), (a, b) -> a + b);
            catMap.merge("Lodging", c.getLodgings().stream().mapToDouble(l -> l.getAmount() != null ? l.getAmount() : 0.0).sum(), (a, b) -> a + b);
            catMap.merge("Conveyance", c.getConveyances().stream().mapToDouble(lc -> lc.getAmount() != null ? lc.getAmount() : 0.0).sum(), (a, b) -> a + b);
            catMap.merge("Wages", c.getWages().stream().mapToDouble(w -> w.getTotalAmount() != null ? w.getTotalAmount() : 0.0).sum(), (a, b) -> a + b);
            catMap.merge("Others", c.getOthers().stream().mapToDouble(o -> o.getAmount() != null ? o.getAmount() : 0.0).sum(), (a, b) -> a + b);
        });

        // 4. Trend Data Generation
        String[] MONTHS = {"Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"};
        int targetYear = LocalDate.now().getYear();
        if (dateFrom != null && !dateFrom.isEmpty()) {
            try { targetYear = LocalDate.parse(dateFrom).getYear(); } catch (Exception e) {}
        }

        Map<String, Double> trendMap = new LinkedHashMap<>();
        for (String month : MONTHS) {
            trendMap.put(month + " " + targetYear, 0.0);
        }

        Map<String, Map<Integer, Double>> dailyTrend = new TreeMap<>();
        for (ReimbursementMaster c : dateIndependentFiltered) {
            if (c.getSubmissionDate() != null) {
                int claimYear = c.getSubmissionDate().getYear();
                int monthIdx = c.getSubmissionDate().getMonthValue() - 1;
                String monthKey = MONTHS[monthIdx] + " " + claimYear;
                
                if (claimYear == targetYear) {
                    trendMap.merge(monthKey, c.getTotalAmountClaimed() != null ? c.getTotalAmountClaimed() : 0.0, Double::sum);
                }
                
                dailyTrend.computeIfAbsent(monthKey, k -> new TreeMap<>())
                        .merge(c.getSubmissionDate().getDayOfMonth(), c.getTotalAmountClaimed() != null ? c.getTotalAmountClaimed() : 0.0, Double::sum);
            }
        }

        Map<String, Long> statusMap = new HashMap<>();
        Map<String, Double> statusAmtMap = new HashMap<>();
        for (ReimbursementMaster c : filtered) {
            String s = c.getStatus();
            if ("MANAGER_APPROVED".equals(s) || "ACCOUNTS_SETTLED".equals(s)) s = "APPROVED";
            
            statusMap.merge(s, 1L, Long::sum);
            statusAmtMap.merge(s, c.getTotalAmountClaimed() != null ? c.getTotalAmountClaimed() : 0.0, Double::sum);
        }

        // 5. Table Data (Recent 10)
        List<ClaimTableDTO> claimList = filtered.stream()
                .sorted(Comparator.comparing(ReimbursementMaster::getSubmissionDate, Comparator.nullsLast(Comparator.reverseOrder())))
                .map(c -> ClaimTableDTO.builder()
                        .id(c.getId())
                        .employeeName(c.getEmployee().getFirstName() + " " + c.getEmployee().getLastName())
                        .employeeCode(c.getEmployee().getEmployeeId())
                        .username(c.getEmployee().getEmail() != null ? c.getEmployee().getEmail().split("@")[0] : "unknown")
                        .reasonForTravel(c.getReasonForTravel())
                        .submissionDate(c.getSubmissionDate())
                        .totalAmount(c.getTotalAmountClaimed())
                        .advanceAmount(c.getAdvanceAmount())
                        .duePayout(c.getAmountToReturn())
                        .status(c.getStatus())
                        .startDate(c.getTravelStartDate() != null && !c.getTravelStartDate().isEmpty() ? LocalDate.parse(c.getTravelStartDate()) : null)
                        .endDate(c.getTravelEndDate() != null && !c.getTravelEndDate().isEmpty() ? LocalDate.parse(c.getTravelEndDate()) : null)
                        .actionDate(c.getStatus().equals("MANAGER_APPROVED") || c.getStatus().equals("APPROVED") ? c.getManagerApprovalDate() : (c.getStatus().equals("ACCOUNTS_SETTLED") || c.getStatus().equals("ACCOUNTS_APPROVED") ? c.getAccountsApprovalDate() : c.getSubmissionDate()))
                        .build())
                .collect(Collectors.toList());

        // 6. Audit Logs
        List<AuditLogDTO> auditLogs = new ArrayList<>();
        List<ReimbursementMaster> logSource = (employeeId == null) ? allClaims : filtered;
        logSource.stream()
                .sorted(Comparator.comparing(ReimbursementMaster::getId, Comparator.reverseOrder()))
                .limit(8)
                .forEach(c -> {
                    if (c.getStatus().contains("APPROVED")) {
                        auditLogs.add(new AuditLogDTO("APPROVE", "Claim #" + c.getId() + " Approved", c.getManagerApprovalBy() != null ? c.getManagerApprovalBy() : "Admin", "Today", "FIN-AUTH"));
                    } else if ("REJECTED".equals(c.getStatus())) {
                        auditLogs.add(new AuditLogDTO("REJECT", "Claim #" + c.getId() + " Rejected", "System", "Yesterday", "DENIED"));
                    } else {
                        auditLogs.add(new AuditLogDTO("SUBMIT", "New Submission #" + c.getId(), c.getEmployee().getFirstName(), "Recent", "USER-SUB"));
                    }
                });

        // 7. Budget Utilization
        Map<String, Double> deptSpending = filtered.stream()
                .filter(c -> c.getEmployee().getDepartment() != null)
                .collect(Collectors.groupingBy(c -> c.getEmployee().getDepartment().getName(),
                        Collectors.summingDouble(c -> c.getTotalAmountClaimed() != null ? c.getTotalAmountClaimed() : 0.0)));

        Map<String, Double> budgetLimits = new HashMap<>();
        budgetLimits.put("Operations", 5000.0);
        budgetLimits.put("Engineering", 20000.0);
        budgetLimits.put("Sales & Marketing", 15000.0);
        budgetLimits.put("HR", 5000.0);

        List<BudgetUtilizationDTO> utilization = deptSpending.entrySet().stream()
                .map(e -> {
                    double limit = budgetLimits.getOrDefault(e.getKey(), 10000.0);
                    return new BudgetUtilizationDTO(e.getKey(), e.getValue(), limit, (e.getValue() / limit) * 100);
                })
                .sorted(Comparator.comparing(BudgetUtilizationDTO::getActualSpending, Comparator.reverseOrder()))
                .collect(Collectors.toList());

        // 8. Calendar Intelligence
        Map<String, DailyClaimSummaryDTO> calendarMap = new HashMap<>();
        for (ReimbursementMaster c : dateIndependentFiltered) {
            if (c.getSubmissionDate() == null) continue;
            String dateKey = c.getSubmissionDate().toString();
            
            DailyClaimSummaryDTO existingDay = calendarMap.getOrDefault(dateKey, 
                DailyClaimSummaryDTO.builder()
                    .amount(0.0)
                    .type("APPROVED")
                    .breakdown(new HashMap<>())
                    .details(new ArrayList<>())
                    .build());

            Map<String, Double> empBreakdown = new HashMap<>();
            empBreakdown.put("Tickets", c.getTickets().stream().mapToDouble(t -> t.getAmount() != null ? t.getAmount() : 0.0).sum());
            empBreakdown.put("Food", c.getFoods().stream().mapToDouble(f -> f.getTotal() != null ? f.getTotal() : 0.0).sum());
            empBreakdown.put("Lodging", c.getLodgings().stream().mapToDouble(l -> l.getAmount() != null ? l.getAmount() : 0.0).sum());
            empBreakdown.put("Conveyance", c.getConveyances().stream().mapToDouble(lc -> lc.getAmount() != null ? lc.getAmount() : 0.0).sum());
            empBreakdown.put("Wages", c.getWages().stream().mapToDouble(w -> w.getTotalAmount() != null ? w.getTotalAmount() : 0.0).sum());
            empBreakdown.put("Others", c.getOthers().stream().mapToDouble(o -> o.getAmount() != null ? o.getAmount() : 0.0).sum());

            EmployeeDailyDetail detail = EmployeeDailyDetail.builder()
                    .employeeName(c.getEmployee() != null ? c.getEmployee().getFirstName() + " " + c.getEmployee().getLastName() : "Unknown")
                    .project(c.getReasonForTravel())
                    .amount(c.getTotalAmountClaimed())
                    .status(c.getStatus())
                    .breakdown(empBreakdown)
                    .build();
            
            existingDay.getDetails().add(detail);
            empBreakdown.forEach((cat, amt) -> existingDay.getBreakdown().merge(cat, amt, Double::sum));
            existingDay.setAmount(existingDay.getAmount() + (c.getTotalAmountClaimed() != null ? c.getTotalAmountClaimed() : 0.0));

            if ("PENDING".equals(c.getStatus()) || "GREY".equals(existingDay.getType())) {
                existingDay.setType("GREY");
            } else {
                double bal = (c.getAmountToReturn() != null) ? c.getAmountToReturn() : 0.0;
                if (bal > 0) existingDay.setType("RED");
                else if (bal < 0 && !"RED".equals(existingDay.getType())) existingDay.setType("GREEN");
            }

            calendarMap.put(dateKey, existingDay);
        }

        return AnalyticsResponse.builder()
                .totalExpenditure(totalExpenditure)
                .totalRequests(filtered.size())
                .approvedPayout(approvedPayout)
                .pendingReviewCount(pendingReviewCount)
                .pendingAuditAmount(pendingAuditAmount)
                .approvedCount(approvedCount)
                .rejectedCount(rejectedCount)
                .categoryBreakdown(catMap)
                .monthlyTrend(trendMap)
                .dailyTrend(dailyTrend)
                .statusDistribution(statusMap)
                .statusAmountDistribution(statusAmtMap)
                .claims(claimList)
                .auditLogs(auditLogs)
                .budgetUtilization(utilization)
                .calendarData(calendarMap)
                .build();
    }
}
