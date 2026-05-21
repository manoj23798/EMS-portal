package com.ems.dto.response;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

@Data
@Builder
public class AttendanceResponse {
    private Long id;
    private Long employeeId;
    private String employeeName;
    private LocalDate date;
    private LocalTime inTime;
    private LocalTime outTime;
    private Long totalHours;
    private Long breakDuration;
    private Long permissionHours;
    private String status;
    private String leaveType;
    private String holidayName;
    private boolean onBreak;
    private List<BreakRecordResponse> breaks;
    private List<PermissionRecordResponse> permissions;

    @Data
    @Builder
    public static class BreakRecordResponse {
        private Long id;
        private LocalTime breakStart;
        private LocalTime breakEnd;
        private Long duration;
        private String breakType; // LUNCH, TEA, or null
    }

    @Data
    @Builder
    public static class PermissionRecordResponse {
        private Long id;
        private LocalTime startTime;
        private LocalTime endTime;
        private Long totalHours;
    }
}
