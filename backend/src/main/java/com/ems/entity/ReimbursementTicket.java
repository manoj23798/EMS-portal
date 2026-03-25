package com.ems.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "reimbursement_ticket")
@Data
@NoArgsConstructor
public class ReimbursementTicket {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reimbursement_id", nullable = false)
    private ReimbursementMaster reimbursementMaster;

    private String travelDate;
    private String travelFrom;
    private String travelTo;
    
    @Column(name = "mode_of_travel")
    private String mode;
    
    private Double amount;
    private String amountExpression; // To store "25+715"
    private String person;
    
    @Column(name = "ticket_available")
    private Boolean ticketAvailable;
    
    @Column(name = "ticket_file")
    private String ticketFile;
}
