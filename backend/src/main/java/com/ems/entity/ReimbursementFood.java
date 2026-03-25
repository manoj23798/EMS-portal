package com.ems.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "reimbursement_food")
@Data
@NoArgsConstructor
public class ReimbursementFood {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reimbursement_id", nullable = false)
    private ReimbursementMaster reimbursementMaster;

    private String date;
    
    private Double morning;
    private Double afternoon;
    private Double evening;
    private Double night;
    
    // Auto calculated: sum of meals
    private Double total;
    
    private Double gst;
    private Double sgst;
    
    @Column(name = "bill_available")
    private Boolean billAvailable;
    
    @Column(name = "bill_file")
    private String billFile;
}
