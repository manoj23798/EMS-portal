package com.ems.repository;

import com.ems.entity.InductionFeedback;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface InductionFeedbackRepository extends JpaRepository<InductionFeedback, Long> {
    Optional<InductionFeedback> findByEmployeeId(Long employeeId);
}
