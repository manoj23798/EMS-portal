package com.ems.repository;

import com.ems.entity.OnboardingChecklist;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface OnboardingChecklistRepository extends JpaRepository<OnboardingChecklist, Long> {
    List<OnboardingChecklist> findByEmployeeId(Long employeeId);
}
