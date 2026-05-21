package com.ems.repository.Employee;

import com.ems.entity.Employee.OnboardingChecklist;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface OnboardingChecklistRepository extends JpaRepository<OnboardingChecklist, Long> {
    Optional<OnboardingChecklist> findByEmployeeId(Long employeeId);
}
