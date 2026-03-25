package com.ems.entity;

import jakarta.persistence.*;
import lombok.Data;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "onboarding_checklist")
@Data
public class OnboardingChecklist {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "employee_id", nullable = false)
    private Employee employee;

    @Column(name = "task_name", nullable = false)
    private String taskName;

    // "Not Started", "In Progress", "Completed"
    @Column(nullable = false, length = 20)
    private String status = "Not Started";

    @UpdateTimestamp
    @Column(name = "completed_at")
    private LocalDateTime completedAt;
}
