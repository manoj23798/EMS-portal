package com.ems.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDate;
import java.util.List;

@Data
public class CommunicationCreateRequest {

    @NotNull(message = "Communication type ID is required")
    private Long communicationTypeId;

    @NotBlank(message = "Title is required")
    private String title;

    private String subject;

    @NotBlank(message = "Description is required")
    private String description;

    @NotNull(message = "Issue date is required")
    private LocalDate issueDate;

    @NotBlank(message = "Target type is required")
    private String targetType; // Single, Group, All

    @NotNull(message = "Created by user ID is required")
    private Long createdById;

    // For targetType = "Single"
    private Long targetEmployeeId;

    // For targetType = "Group"
    private Long targetDepartmentId;
    private String targetRole; // e.g., "EMPLOYEE", "MANAGER"

}
