package com.ems.dto.response;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class HandbookVersionResponse {
    private Long id;
    private String version;
    private String content;
    private String documentUrl;
    private Long updatedById;
    private String updatedByName;
    private LocalDateTime updatedAt;
}
