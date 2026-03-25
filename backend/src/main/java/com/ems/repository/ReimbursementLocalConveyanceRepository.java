package com.ems.repository;

import com.ems.entity.ReimbursementLocalConveyance;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ReimbursementLocalConveyanceRepository extends JpaRepository<ReimbursementLocalConveyance, Long> {
}
