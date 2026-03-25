package com.ems.dto.response;

import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

@Data
public class HandbookPolicyResponse {
    private Long id;
    private String title;
    private String description;
    private String content;
    private String documentUrl;
    private String version;
    private String status;
    private Long createdById;
    private String createdByName;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    
    // History of previous versions
    private List<HandbookVersionResponse> versionHistory;
}
