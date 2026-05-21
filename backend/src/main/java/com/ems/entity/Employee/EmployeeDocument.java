package com.ems.entity.Employee;

import jakarta.persistence.*;
import lombok.Data;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "employee_documents")
@Data
public class EmployeeDocument {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "employee_id", nullable = false)
    private Employee employee;

    @Column(name = "document_type", nullable = false, length = 100)
    private String documentType; // e.g., Aadhaar Card, UG Certificate, NDA

    @Column(name = "category", nullable = false, length = 50)
    private String category; // PERSONAL, EDUCATION, EMPLOYMENT, FINANCIAL, COMPANY

    @Column(name = "document_url", nullable = false, length = 255)
    private String documentUrl;

    @CreationTimestamp
    @Column(name = "uploaded_at", updatable = false)
    private LocalDateTime uploadedAt;
}
