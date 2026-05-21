package com.ems.repository.Attendance;

import com.ems.entity.Attendance.BreakRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface BreakRecordRepository extends JpaRepository<BreakRecord, Long> {
}
