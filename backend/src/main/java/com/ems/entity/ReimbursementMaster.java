package com.ems.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "reimbursement_master")
@Data
@NoArgsConstructor
public class ReimbursementMaster {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "employee_id", nullable = false)
    private Employee employee;

    @Column(name = "reason_for_travel")
    private String reasonForTravel;

    @Column(name = "travel_start_date")
    private String travelStartDate;

    @Column(name = "travel_end_date")
    private String travelEndDate;

    @Column(name = "submission_date")
    private LocalDate submissionDate;

    // e.g., PENDING, MANAGER_APPROVED, REJECTED, ACCOUNTS_SETTLED
    private String status;

    @Column(name = "total_amount_claimed")
    private Double totalAmountClaimed;

    @Column(name = "advance_amount")
    private Double advanceAmount;

    @Column(name = "amount_to_return")
    private Double amountToReturn;

    @Column(name = "manager_approval_date")
    private LocalDate managerApprovalDate;

    @Column(name = "manager_approval_by")
    private String managerApprovalBy;

    // Accounts section fields
    @Column(name = "accounts_approved_amount")
    private Double accountsApprovedAmount;

    @Column(name = "accounts_reason")
    private String accountsReason;

    @Column(name = "accounts_approval_date")
    private LocalDate accountsApprovalDate;

    @Column(name = "accounts_approval_by")
    private String accountsApprovalBy;

    // Child relations
    @OneToMany(mappedBy = "reimbursementMaster", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<ReimbursementTicket> tickets = new ArrayList<>();

    @OneToMany(mappedBy = "reimbursementMaster", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<ReimbursementLodging> lodgings = new ArrayList<>();

    @OneToMany(mappedBy = "reimbursementMaster", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<ReimbursementLocalConveyance> conveyances = new ArrayList<>();

    @OneToMany(mappedBy = "reimbursementMaster", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<ReimbursementFood> foods = new ArrayList<>();

    @OneToMany(mappedBy = "reimbursementMaster", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<ReimbursementOthers> others = new ArrayList<>();

    @OneToMany(mappedBy = "reimbursementMaster", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<ReimbursementWages> wages = new ArrayList<>();

    // Helper methods for bidirectional relationships
    public void addTicket(ReimbursementTicket ticket) {
        tickets.add(ticket);
        ticket.setReimbursementMaster(this);
    }
    
    public void addLodging(ReimbursementLodging lodging) {
        lodgings.add(lodging);
        lodging.setReimbursementMaster(this);
    }
    
    public void addConveyance(ReimbursementLocalConveyance conveyance) {
        conveyances.add(conveyance);
        conveyance.setReimbursementMaster(this);
    }
    
    public void addFood(ReimbursementFood food) {
        foods.add(food);
        food.setReimbursementMaster(this);
    }
    
    public void addOther(ReimbursementOthers other) {
        others.add(other);
        other.setReimbursementMaster(this);
    }
    
    public void addWage(ReimbursementWages wage) {
        wages.add(wage);
        wage.setReimbursementMaster(this);
    }
}
