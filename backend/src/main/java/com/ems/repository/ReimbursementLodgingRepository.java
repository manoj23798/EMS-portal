package com.ems.repository;

import com.ems.entity.ReimbursementLodging;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ReimbursementLodgingRepository extends JpaRepository<ReimbursementLodging, Long> {
}
