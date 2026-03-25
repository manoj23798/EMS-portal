package com.ems.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import org.springframework.web.multipart.MultipartFile;

@Data
public class HandbookUploadRequest {
    @NotBlank(message = "Policy title is required")
    private String title;

    private String description;
    
    // Kept for updating version manually via HR if needed, though auto-increment is preferred
    private String version; 
}
