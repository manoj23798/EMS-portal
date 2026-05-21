package com.ems.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class LeaveCancelRequest {

    @NotBlank(message = "Cancel reason is required")
    private String cancelReason;
}