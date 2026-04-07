package com.ems.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class AuditLogDTO {
    private String type; // e.g., APPROVE, REJECT, SUBMIT, FLAG
    private String message;
    private String actorName;
    private String timestamp;
    private String badgeText;
}
