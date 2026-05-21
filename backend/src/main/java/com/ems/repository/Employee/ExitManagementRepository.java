package com.ems.repository.Employee;

import com.ems.entity.Employee.ExitManagement;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface ExitManagementRepository extends JpaRepository<ExitManagement, Long> {
    Optional<ExitManagement> findByEmployeeId(Long employeeId);
}
