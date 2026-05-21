package com.ems.repository.Reimbursement;

import com.ems.entity.Reimbursement.ReimbursementTicket;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ReimbursementTicketRepository extends JpaRepository<ReimbursementTicket, Long> {
}
