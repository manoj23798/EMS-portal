package com.ems.controller;

import com.ems.dto.response.NotificationResponse;
import com.ems.security.JwtUtil;
import com.ems.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;
    private final JwtUtil jwtUtil;

    @GetMapping
    public ResponseEntity<List<NotificationResponse>> getMyNotifications(@RequestHeader("Authorization") String token) {
        Long employeeId = extractEmployeeId(token);
        return ResponseEntity.ok(notificationService.getMyNotifications(employeeId));
    }

    @GetMapping("/unread-count")
    public ResponseEntity<Long> getUnreadCount(@RequestHeader("Authorization") String token) {
        Long employeeId = extractEmployeeId(token);
        return ResponseEntity.ok(notificationService.getUnreadCount(employeeId));
    }

    @PutMapping("/{id}/read")
    public ResponseEntity<Void> markAsRead(@PathVariable Long id, @RequestHeader("Authorization") String token) {
        Long employeeId = extractEmployeeId(token);
        notificationService.markAsRead(id, employeeId);
        return ResponseEntity.ok().build();
    }

    private Long extractEmployeeId(String token) {
        String jwt = token.substring(7);
        return jwtUtil.extractUserId(jwt);
    }
}
