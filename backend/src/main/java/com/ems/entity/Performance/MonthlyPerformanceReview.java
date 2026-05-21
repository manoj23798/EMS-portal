package com.ems.entity.Performance;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "monthly_performance_reviews")
@Data
@NoArgsConstructor
public class MonthlyPerformanceReview {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "employee_id", nullable = false)
    private Long employeeId;

    @Column(name = "employee_name")
    private String employeeName;

    @Column(name = "employee_role")
    private String employeeRole;

    @Column(name = "employee_department")
    private String employeeDepartment;

    @Column(name = "evaluator_id")
    private Long evaluatorId;

    @Column(name = "template_id")
    private Long templateId;

    @Column(name = "review_month", nullable = false)
    private Integer month; // 1 to 12

    @Column(name = "review_year", nullable = false)
    private Integer year;

    @Column(length = 20)
    private String status; // DRAFT, SUBMITTED

    @Column(name = "total_score")
    private Double totalScore;

    @Column(name = "review_data", columnDefinition = "TEXT")
    private String reviewData; // JSON storing the answers

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
