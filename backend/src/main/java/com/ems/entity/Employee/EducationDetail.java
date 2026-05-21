package com.ems.entity.Employee;

import jakarta.persistence.*;
import lombok.Data;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "education_details")
@Data
public class EducationDetail {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "employee_id", nullable = false)
    private Employee employee;

    @Column(name = "degree_name", nullable = false, length = 100)
    private String degreeName; // 10th, 12th, UG, PG, etc.

    @Column(name = "institution_name", length = 255)
    private String institutionName;

    @Column(name = "passing_year", length = 10)
    private String passingYear;

    @Column(name = "percentage_cgpa", length = 20)
    private String percentageCgpa;

    @Column(name = "document_url", length = 255)
    private String documentUrl;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
}
