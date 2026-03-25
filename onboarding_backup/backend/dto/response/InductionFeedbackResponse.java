package com.ems.dto.response;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class InductionFeedbackResponse {
    private Long id;
    private Long employeeId;
    private String employeeName;
    private Integer rating;
    private String feedback;
    private String suggestions;
    private LocalDateTime submittedAt;
}
