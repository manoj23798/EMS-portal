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
    private String status;
    private List<BreakRecordResponse> breaks;
}

@Data
@Builder
class BreakRecordResponse {
    private Long id;
    private LocalTime breakStart;
    private LocalTime breakEnd;
    private Long duration;
}
