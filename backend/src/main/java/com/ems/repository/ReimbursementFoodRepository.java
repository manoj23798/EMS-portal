package com.ems.repository;

import com.ems.entity.ReimbursementFood;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ReimbursementFoodRepository extends JpaRepository<ReimbursementFood, Long> {
}
