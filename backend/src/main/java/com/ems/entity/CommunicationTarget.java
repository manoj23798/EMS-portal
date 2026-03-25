package com.ems.entity;

import jakarta.persistence.*;
import lombok.Data;

@Data
@Entity
@Table(name = "communication_targets")
public class CommunicationTarget {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "communication_id", nullable = false)
    private Communication communication;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "employee_id")
    private Employee employee;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "department_id")
    private Department department;

    @Enumerated(EnumType.STRING)
    @Column(name = "role_name")
    private EmployeeRole role;

    public enum EmployeeRole {
        ADMIN, HR, MANAGER, IT, EMPLOYEE
    }
}
