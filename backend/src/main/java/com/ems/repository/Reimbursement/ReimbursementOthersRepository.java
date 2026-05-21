package com.ems.repository.Reimbursement;

import com.ems.entity.Reimbursement.ReimbursementOthers;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ReimbursementOthersRepository extends JpaRepository<ReimbursementOthers, Long> {
}
