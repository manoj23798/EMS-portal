package com.ems.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "reimbursement_wages")
@Data
@NoArgsConstructor
public class ReimbursementWages {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reimbursement_id", nullable = false)
    private ReimbursementMaster reimbursementMaster;

    private String name;
    
    @Column(name = "from_date")
    private String fromDate;
    
    @Column(name = "to_date")
    private String toDate;
    
    @Column(name = "days_worked")
    private Double daysWorked;
    
    @Column(name = "per_day_salary")
    private Double perDaySalary;
    
    // Auto calculated: daysWorked * perDaySalary
    @Column(name = "total_amount")
    private Double totalAmount;
}
