package com.ems.repository;

import com.ems.entity.ReimbursementTicket;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ReimbursementTicketRepository extends JpaRepository<ReimbursementTicket, Long> {
}
