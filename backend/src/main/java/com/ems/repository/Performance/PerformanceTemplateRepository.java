package com.ems.repository.Performance;

import com.ems.entity.Performance.PerformanceTemplate;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface PerformanceTemplateRepository extends JpaRepository<PerformanceTemplate, Long> {
}
