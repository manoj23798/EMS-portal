package com.ems.repository;

import com.ems.entity.Notification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, Long> {
    
    // Fetch notifications for a specific user (either targeted directly or broadcast where recipient is null)
    @Query("SELECT n FROM Notification n WHERE n.recipient.id = :employeeId OR n.recipient IS NULL ORDER BY n.createdAt DESC")
    List<Notification> findMyNotifications(@Param("employeeId") Long employeeId);
    
    @Query("SELECT COUNT(n) FROM Notification n WHERE (n.recipient.id = :employeeId OR n.recipient IS NULL) AND n.isRead = false")
    Long countUnreadForEmployee(@Param("employeeId") Long employeeId);
}
