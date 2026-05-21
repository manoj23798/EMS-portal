package com.ems.controller.Leave;

import com.ems.service.Interface.LeaveAnalyticsService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/leave/stats")
@RequiredArgsConstructor
public class LeaveDashboardController {

    private final LeaveAnalyticsService analyticsService;

    @GetMapping("/analytics")
    public Map<String, Object> getAnalytics(
            @RequestParam(required = false) Long employeeId,
            @RequestParam(required = false) Long departmentId,
            @RequestParam(defaultValue = "#{T(java.time.LocalDate).now().withDayOfYear(1)}") LocalDate start,
            @RequestParam(defaultValue = "#{T(java.time.LocalDate).now().withDayOfYear(T(java.time.LocalDate).now().lengthOfYear())}") LocalDate end
    ) {
        return analyticsService.getDashboardStats(employeeId, departmentId, start, end);
    }

    @GetMapping("/calendar")
    public List<Map<String, Object>> getCalendar(
            @RequestParam String start,
            @RequestParam String end) {
        return analyticsService.getLeaveCalendar(LocalDate.parse(start), LocalDate.parse(end));
    }
}
