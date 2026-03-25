package com.ems.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "reimbursement_others")
@Data
@NoArgsConstructor
public class ReimbursementOthers {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reimbursement_id", nullable = false)
    private ReimbursementMaster reimbursementMaster;

    private String date;
    private String description;
    private Double amount;
    
    @Column(name = "bill_available")
    private Boolean billAvailable;
    
    @Column(name = "bill_file")
    private String billFile;
}
