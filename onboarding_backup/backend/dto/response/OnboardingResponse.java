package com.ems.dto.response;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class OnboardingResponse {
    private Long id;
    private Long employeeId;
    private String employeeName;
    private String departmentName;
    private String designationTitle;
    private String status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
