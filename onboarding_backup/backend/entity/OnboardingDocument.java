package com.ems.entity;

import jakarta.persistence.*;
import lombok.Data;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "onboarding_documents")
@Data
public class OnboardingDocument {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "employee_id", nullable = false)
    private Employee employee;

    @Column(name = "document_type", nullable = false)
    private String documentType; // e.g. "Aadhaar", "PAN", "NDA"

    @Column(name = "file_url", nullable = false, length = 2048)
    private String fileUrl;

    // "Pending", "Approved", "Rejected"
    @Column(name = "verification_status", nullable = false, length = 20)
    private String verificationStatus = "Pending";

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "verified_by")
    private Employee verifiedBy; // The HR who verified it

    @CreationTimestamp
    @Column(name = "uploaded_at", updatable = false)
    private LocalDateTime uploadedAt;
}
