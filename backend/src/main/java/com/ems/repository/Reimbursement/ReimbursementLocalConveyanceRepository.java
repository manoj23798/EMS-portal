package com.ems.repository.Reimbursement;

import com.ems.entity.Reimbursement.ReimbursementLocalConveyance;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ReimbursementLocalConveyanceRepository extends JpaRepository<ReimbursementLocalConveyance, Long> {
}
