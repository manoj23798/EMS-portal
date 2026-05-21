package com.ems.repository.Reimbursement;

import com.ems.entity.Reimbursement.ReimbursementWages;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ReimbursementWagesRepository extends JpaRepository<ReimbursementWages, Long> {
}
