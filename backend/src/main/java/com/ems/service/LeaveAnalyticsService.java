package com.ems.service;

import java.time.LocalDate;
import java.util.Map;
import java.util.List;

public interface LeaveAnalyticsService {
    Map<String, Object> getDashboardStats(Long employeeId, Long departmentId, LocalDate startDate, LocalDate endDate);
    List<Map<String, Object>> getLeaveCalendar(LocalDate start, LocalDate end);
}
