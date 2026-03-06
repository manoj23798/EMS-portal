package com.ems.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "leave_balance", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"employee_id", "leave_type", "year"})
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LeaveBalance {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "employee_id", nullable = false)
    private Employee employee;

    @Column(name = "leave_type", nullable = false, length = 50)
    private String leaveType;

    @Column(name = "total_leaves", nullable = false)
    private Integer totalLeaves;

    @Column(name = "used_leaves", nullable = false)
    @Builder.Default
    private Integer usedLeaves = 0;

    @Column(name = "remaining_leaves", nullable = false)
    private Integer remainingLeaves;

    @Column(nullable = false)
    private Integer year;
}
