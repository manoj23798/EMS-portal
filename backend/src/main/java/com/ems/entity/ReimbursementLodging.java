package com.ems.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "reimbursement_lodging")
@Data
@NoArgsConstructor
public class ReimbursementLodging {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reimbursement_id", nullable = false)
    private ReimbursementMaster reimbursementMaster;

    private String dateRange;
    private String location;
    
    private Integer days;
    private Integer persons;
    
    @Column(name = "rate_per_person")
    private Double ratePerPerson;
    
    // Auto calculated: Days * Persons * Rate
    private Double amount;
    
    @Column(name = "bill_available")
    private Boolean billAvailable;
    
    @Column(name = "bill_file")
    private String billFile;
}
