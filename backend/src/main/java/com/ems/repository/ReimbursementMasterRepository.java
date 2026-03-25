package com.ems.repository;

import com.ems.entity.ReimbursementMaster;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ReimbursementMasterRepository extends JpaRepository<ReimbursementMaster, Long> {
    List<ReimbursementMaster> findByEmployeeId(Long employeeId);
    List<ReimbursementMaster> findByStatus(String status);
}
