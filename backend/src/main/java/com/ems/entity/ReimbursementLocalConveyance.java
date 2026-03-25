package com.ems.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "reimbursement_local_conveyance")
@Data
@NoArgsConstructor
public class ReimbursementLocalConveyance {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reimbursement_id", nullable = false)
    private ReimbursementMaster reimbursementMaster;

    private String date;
    
    @Column(name = "location_from")
    private String locationFrom;
    
    @Column(name = "location_to")
    private String locationTo;
    
    @Column(name = "mode_of_travel")
    private String modeOfTravel;
    
    private Double amount;
    
    @Column(name = "ticket_available")
    private Boolean ticketAvailable;
    
    @Column(name = "ticket_file")
    private String ticketFile;
}
