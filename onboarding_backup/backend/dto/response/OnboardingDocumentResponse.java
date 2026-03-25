package com.ems.dto.response;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class OnboardingDocumentResponse {
    private Long id;
    private String documentType;
    private String fileUrl;
    private String verificationStatus;
    private String verifiedByName;
    private LocalDateTime uploadedAt;
}
