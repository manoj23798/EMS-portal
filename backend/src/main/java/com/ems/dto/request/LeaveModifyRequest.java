package com.ems.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDate;

@Data
public class LeaveModifyRequest {

    @NotNull(message = "Proposed start date is required")
    private LocalDate proposedStartDate;

    @NotNull(message = "Proposed end date is required")
    private LocalDate proposedEndDate;

    @NotNull(message = "Proposed total days is required")
    private Double proposedTotalDays;

    @NotBlank(message = "Proposed reason is required")
    private String proposedReason;
}
