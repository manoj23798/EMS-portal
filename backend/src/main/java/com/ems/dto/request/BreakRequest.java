package com.ems.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class BreakRequest {
    @NotNull(message = "Attendance ID is required")
    private Long attendanceId;
}
