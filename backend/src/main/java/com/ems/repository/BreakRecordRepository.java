package com.ems.repository;

import com.ems.entity.BreakRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface BreakRecordRepository extends JpaRepository<BreakRecord, Long> {
}
