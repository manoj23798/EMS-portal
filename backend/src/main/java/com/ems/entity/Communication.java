package com.ems.entity;

import jakarta.persistence.*;
import lombok.Data;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "communications")
public class Communication {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "communication_type_id", nullable = false)
    private CommunicationType communicationType;

    @Column(nullable = false)
    private String title;

    private String subject;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String description;

    private String attachmentUrl;

    @Column(nullable = false)
    private LocalDate issueDate;

    @Column(nullable = false)
    private String targetType; // "Single", "Group", "All"

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by_id", nullable = false)
    private Employee createdBy;

    @CreationTimestamp
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;
}
