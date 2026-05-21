package com.ems.service.implementation;

import com.ems.entity.Employee.Employee;
import com.ems.entity.leave_And_permission.Holiday;
import com.ems.entity.leave_And_permission.LeaveRequest;
import com.ems.repository.Employee.EmployeeRepository;
import com.ems.repository.Leave_and_permission.HolidayRepository;
import com.ems.repository.Leave_and_permission.LeaveRequestRepository;
import com.ems.service.Interface.LeaveAnalyticsService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class LeaveAnalyticsServiceImpl implements LeaveAnalyticsService {

    private final LeaveRequestRepository leaveRequestRepository;
    private final HolidayRepository holidayRepository;
    private final EmployeeRepository employeeRepository;

    @Override
    public Map<String, Object> getDashboardStats(Long employeeId, Long departmentId, LocalDate startDate,
            LocalDate endDate) {
        List<LeaveRequest> allRequests = leaveRequestRepository.findAll();

        // Filter logic with null-safety
        List<LeaveRequest> filtered = allRequests.stream()
                .filter(lr -> lr.getEmployee() != null)
                .filter(lr -> (employeeId == null || lr.getEmployee().getId().equals(employeeId)))
                .filter(lr -> {
                    if (departmentId == null)
                        return true;
                    Employee emp = lr.getEmployee();
                    return emp != null && emp.getDepartment() != null
                            && emp.getDepartment().getId().equals(departmentId);
                })
                .filter(lr -> lr.getStartDate() != null && lr.getEndDate() != null)
                .filter(lr -> !lr.getStartDate().isAfter(endDate) && !lr.getEndDate().isBefore(startDate))
                .collect(Collectors.toList());

        Map<String, Object> stats = new HashMap<>();

        // Summary Cards
        long totalEmployees = employeeRepository.count();
        stats.put("totalEmployees", totalEmployees);
        stats.put("totalLeavesTaken", filtered.stream()
                .filter(lr -> "Approved".equalsIgnoreCase(lr.getStatus()))
                .mapToDouble(lr -> {
                    double total = lr.getTotalDays() != null ? lr.getTotalDays() : 0.0;
                    double lop = lr.getLopCount() != null ? lr.getLopCount() : 0.0;
                    return Math.max(0.0, total - lop);
                })
                .sum());
        stats.put("totalApproved", filtered.stream().filter(lr -> "Approved".equalsIgnoreCase(lr.getStatus())).count());
        stats.put("totalPending", filtered.stream().filter(lr -> "Pending".equalsIgnoreCase(lr.getStatus())).count());
        stats.put("totalLOP", filtered.stream()
                .filter(lr -> lr.isLop() && "Approved".equalsIgnoreCase(lr.getStatus()))
                .mapToDouble(lr -> lr.getLopCount() != null ? lr.getLopCount() : 0.0)
                .sum());

        // Employee on Leave Today
        LocalDate today = LocalDate.now();
        List<Map<String, String>> onLeaveDetails = allRequests.stream()
                .filter(lr -> lr.getEmployee() != null && lr.getLeaveType() != null)
                .filter(lr -> "Approved".equalsIgnoreCase(lr.getStatus()))
                .filter(lr -> lr.getStartDate() != null && lr.getEndDate() != null)
                .filter(lr -> !today.isBefore(lr.getStartDate()) && !today.isAfter(lr.getEndDate()))
                .map(lr -> {
                    Map<String, String> m = new HashMap<>();
                    m.put("name", lr.getEmployee().getFirstName() + " " + lr.getEmployee().getLastName());
                    m.put("type", lr.getLeaveType().getName() != null ? lr.getLeaveType().getName() : "General");
                    m.put("period", lr.getStartDate() + " - " + lr.getEndDate());
                    m.put("photo", "https://i.pravatar.cc/150?u=" + lr.getEmployee().getEmployeeId());
                    return m;
                }).collect(Collectors.toList());

        stats.put("onLeaveToday", onLeaveDetails.size());
        stats.put("onLeaveEmployees", onLeaveDetails);

        // Pie Chart: Distribution
        Map<String, Long> distribution = filtered.stream()
                .filter(lr -> lr.getLeaveType() != null && "Approved".equalsIgnoreCase(lr.getStatus()))
                .collect(Collectors.groupingBy(lr -> {
                    String name = lr.getLeaveType().getName();
                    return name != null ? name : "Unknown";
                }, Collectors.counting()));
        stats.put("distribution", distribution);

        // Top Row Type Counts
        long sick = distribution.getOrDefault("Sick Leave", 0L);
        long annual = distribution.getOrDefault("Annual Leave", 0L) + distribution.getOrDefault("Casual Leave", 0L);
        long other = distribution.entrySet().stream()
                .filter(e -> !e.getKey().contains("Annual") && !e.getKey().contains("Casual")
                        && !e.getKey().contains("Sick"))
                .mapToLong(Map.Entry::getValue).sum();

        stats.put("annualCount", annual);
        stats.put("sickCount", sick);
        stats.put("otherCount", other);

        // Velocity: Last 7 days trend
        List<Map<String, Object>> velocity = new ArrayList<>();
        for (int i = 6; i >= 0; i--) {
            LocalDate date = LocalDate.now().minusDays(i);
            long count = allRequests.stream()
                    .filter(lr -> lr.getStartDate() != null && lr.getEndDate() != null)
                    .filter(lr -> "Approved".equalsIgnoreCase(lr.getStatus()))
                    .filter(lr -> !date.isBefore(lr.getStartDate()) && !date.isAfter(lr.getEndDate()))
                    .count();

            Map<String, Object> v = new HashMap<>();
            v.put("day", date.getDayOfWeek().name().substring(0, 3));
            v.put("count", count);
            velocity.add(v);
        }
        stats.put("velocity", velocity);

        // Monthly Trend
        Map<String, Long> trend = filtered.stream()
                .filter(lr -> lr.getStartDate() != null && "Approved".equalsIgnoreCase(lr.getStatus()))
                .collect(Collectors.groupingBy(lr -> lr.getStartDate().getMonth().name(), Collectors.counting()));
        stats.put("trend", trend);

        return stats;
    }

    @Override
    public List<Map<String, Object>> getLeaveCalendar(LocalDate start, LocalDate end) {
        List<Map<String, Object>> calendarEvents = new ArrayList<>();

        // Add Holidays
        try {
            List<Holiday> holidays = holidayRepository.findByDateBetween(start, end);
            for (Holiday h : holidays) {
                if (h.getDate() == null)
                    continue;
                Map<String, Object> event = new HashMap<>();
                event.put("title", h.getName() != null ? h.getName() : "Holiday");
                event.put("start", h.getDate());
                event.put("end", h.getDate());
                event.put("type", "HOLIDAY");
                event.put("category", h.getType() != null ? h.getType() : "GOVERNMENT");

                String fallbackColor = (h.getType() == Holiday.HolidayType.COMPANY) ? "#3b82f6" : "#ef4444";
                event.put("color", h.getColor() != null ? h.getColor() : fallbackColor);
                calendarEvents.add(event);
            }
        } catch (Exception e) {
            System.err.println("Calendar Error (Holidays): " + e.getMessage());
        }

        // Add Employee Leaves
        try {
            List<LeaveRequest> leaves = leaveRequestRepository.findAll().stream()
                    .filter(lr -> lr.getEmployee() != null && lr.getLeaveType() != null)
                    .filter(lr -> lr.getStartDate() != null && lr.getEndDate() != null)
                    .filter(lr -> !lr.getStartDate().isAfter(end) && !lr.getEndDate().isBefore(start))
                    .filter(lr -> "Approved".equalsIgnoreCase(lr.getStatus())
                            || "Pending".equalsIgnoreCase(lr.getStatus()))
                    .collect(Collectors.toList());

            for (LeaveRequest lr : leaves) {
                Map<String, Object> event = new HashMap<>();
                String typeName = lr.getLeaveType().getName() != null ? lr.getLeaveType().getName() : "Leave";
                event.put("title", lr.getEmployee().getFirstName() + " (" + typeName + ")");
                event.put("start", lr.getStartDate());
                event.put("end", lr.getEndDate());
                event.put("employeeName", lr.getEmployee().getFirstName() + " " + lr.getEmployee().getLastName());
                event.put("type", "LEAVE");
                event.put("status", lr.getStatus() != null ? lr.getStatus() : "Pending");
                event.put("isLop", lr.isLop());

                String typeColor = lr.getLeaveType().getColor();
                event.put("color", lr.isLop() ? "#f97316" : (typeColor != null ? typeColor : "#10b981"));
                calendarEvents.add(event);
            }
        } catch (Exception e) {
            System.err.println("Calendar Error (Leaves): " + e.getMessage());
        }

        return calendarEvents;
    }
}
