package com.ems.repository.Reimbursement;

import com.ems.entity.Reimbursement.ReimbursementFood;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ReimbursementFoodRepository extends JpaRepository<ReimbursementFood, Long> {
}
