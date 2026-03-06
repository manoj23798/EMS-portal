package com.ems.dto.response;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

@Data
@Builder
public class PermissionRequestResponse {
    private Long id;
    private Long employeeId;
    private String employeeName;
    private LocalDate date;
    private LocalTime startTime;
    private LocalTime endTime;
    private Long totalHours;
    private String reason;
    private String status;
    private String approvedByName;
    private LocalDateTime createdAt;
}
