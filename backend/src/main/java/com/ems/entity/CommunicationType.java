package com.ems.entity;

import jakarta.persistence.*;
import lombok.Data;

@Data
@Entity
@Table(name = "communication_types")
public class CommunicationType {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String typeName; // e.g., "Memo", "Warning Letter", "Increment Letter", "General Announcement"

    private String description;
}
