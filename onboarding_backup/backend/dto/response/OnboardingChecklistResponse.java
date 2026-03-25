package com.ems.dto.response;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class OnboardingChecklistResponse {
    private Long id;
    private String taskName;
    private String status;
    private LocalDateTime completedAt;
}
