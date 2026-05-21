package com.ems.repository.Leave_and_permission;

import com.ems.entity.Employee.Employee;
import com.ems.entity.leave_And_permission.PermissionRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface PermissionRequestRepository extends JpaRepository<PermissionRequest, Long> {

    List<PermissionRequest> findByEmployeeOrderByCreatedAtDesc(Employee employee);

    List<PermissionRequest> findByStatusOrderByCreatedAtDesc(String status);

    List<PermissionRequest> findByEmployeeAndDateAndStatusOrderByStartTimeAsc(Employee employee, LocalDate date,
            String status);
}
