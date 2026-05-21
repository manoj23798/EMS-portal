package com.ems.repository.Employee;

import com.ems.entity.Employee.InductionFeedback;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface InductionFeedbackRepository extends JpaRepository<InductionFeedback, Long> {
    Optional<InductionFeedback> findByEmployeeId(Long employeeId);
}
