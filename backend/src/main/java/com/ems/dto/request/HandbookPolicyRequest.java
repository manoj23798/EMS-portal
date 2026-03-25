package com.ems.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class HandbookPolicyRequest {
    @NotBlank(message = "Policy title is required")
    private String title;

    private String description;
    
    @NotBlank(message = "Content is required")
    private String content;

    private String version; 
}
