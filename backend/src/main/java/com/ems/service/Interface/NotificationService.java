package com.ems.service.Interface;

import com.ems.dto.response.NotificationResponse;

import java.util.List;

public interface NotificationService {
    void createGlobalNotification(String message);
    void createTargetedNotification(Long employeeId, String message);
    List<NotificationResponse> getMyNotifications(Long employeeId);
    Long getUnreadCount(Long employeeId);
    void markAsRead(Long notificationId, Long employeeId);
}
