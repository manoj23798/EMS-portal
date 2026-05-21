package com.ems.repository.Employee;

import com.ems.entity.Employee.BackgroundVerification;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface BackgroundVerificationRepository extends JpaRepository<BackgroundVerification, Long> {
    Optional<BackgroundVerification> findByEmployeeId(Long employeeId);
}
