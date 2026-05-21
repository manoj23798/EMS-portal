package com.ems.repository.Reimbursement;

import com.ems.entity.Reimbursement.ReimbursementLodging;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ReimbursementLodgingRepository extends JpaRepository<ReimbursementLodging, Long> {
}
