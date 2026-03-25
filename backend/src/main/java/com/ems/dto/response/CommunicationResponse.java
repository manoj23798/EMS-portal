package com.ems.dto.response;

import lombok.Data;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
public class CommunicationResponse {
    private Long id;
    private Long communicationTypeId;
    private String communicationTypeName;
    private String title;
    private String subject;
    private String description;
    private String attachmentUrl;
    private LocalDate issueDate;
    private String targetType;
    private Long createdById;
    private String createdByName;
    private LocalDateTime createdAt;
    
    // Status can be implied based on issue date, etc.
    private String status; 
    
    // For specific targets
    private Long targetEmployeeId;
    private String targetEmployeeName;
    private Long targetDepartmentId;
    private String targetDepartmentName;
    private String targetRole;
}
