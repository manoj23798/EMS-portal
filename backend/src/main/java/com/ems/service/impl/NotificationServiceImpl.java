package com.ems.service.impl;

import com.ems.dto.response.NotificationResponse;
import com.ems.entity.Employee;
import com.ems.entity.Notification;
import com.ems.exception.ResourceNotFoundException;
import com.ems.repository.EmployeeRepository;
import com.ems.repository.NotificationRepository;
import com.ems.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class NotificationServiceImpl implements NotificationService {

    private final NotificationRepository notificationRepository;
    private final EmployeeRepository employeeRepository;

    @Override
    @Transactional
    public void createGlobalNotification(String message) {
        Notification notification = new Notification();
        notification.setMessage(message);
        notification.setRecipient(null); // null means broadcast
        notificationRepository.save(notification);
    }

    @Override
    @Transactional
    public void createTargetedNotification(Long employeeId, String message) {
        Employee recipient = employeeRepository.findById(employeeId)
                .orElseThrow(() -> new ResourceNotFoundException("Employee not found"));
                
        Notification notification = new Notification();
        notification.setMessage(message);
        notification.setRecipient(recipient);
        notificationRepository.save(notification);
    }

    @Override
    public List<NotificationResponse> getMyNotifications(Long employeeId) {
        return notificationRepository.findMyNotifications(employeeId).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    public Long getUnreadCount(Long employeeId) {
        return notificationRepository.countUnreadForEmployee(employeeId);
    }

    @Override
    @Transactional
    public void markAsRead(Long notificationId, Long employeeId) {
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new ResourceNotFoundException("Notification not found"));
        
        // Either global notification (recipient == null) or specifically for this user
        if (notification.getRecipient() == null || notification.getRecipient().getId().equals(employeeId)) {
             notification.setIsRead(true);
             notificationRepository.save(notification);
             // Note: If we mark a global broadcast as read, it updates for everyone in this simple model.
             // To properly track read status per-user for global broadcasts, a separate join table is technically needed,
             // but for now, we just update the specific record.
        } else {
             throw new RuntimeException("Unauthorized to read this notification");
        }
    }
    
    private NotificationResponse mapToResponse(Notification n) {
        NotificationResponse res = new NotificationResponse();
        res.setId(n.getId());
        res.setMessage(n.getMessage());
        res.setIsRead(n.getIsRead());
        res.setCreatedAt(n.getCreatedAt());
        if (n.getRecipient() != null) {
            res.setRecipientId(n.getRecipient().getId());
        }
        return res;
    }
}
