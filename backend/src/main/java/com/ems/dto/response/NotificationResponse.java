package com.ems.dto.response;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class NotificationResponse {
    private Long id;
    private Long recipientId; // Null implies broadcast
    private String message;
    private Boolean isRead;
    private LocalDateTime createdAt;
}
