package com.ems.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "leave_types")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class LeaveType {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String name;

    private boolean isPaid = true;

    private int totalDays;

    private String color = "#34d399"; // Default to emerald green

    private boolean requireApproval = true;

    private boolean requireAttachment = false;

    private boolean isCarryForward = false;

    private Integer monthlyLimit; // Optional

    private Integer applicableAfterMonths = 0; // Default: immediately applicable

    private String genderRestriction; // Optional: "MALE", "FEMALE", etc.
}
