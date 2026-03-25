package com.ems.repository;

import com.ems.entity.ReimbursementOthers;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ReimbursementOthersRepository extends JpaRepository<ReimbursementOthers, Long> {
}
