package com.ems.repository;

import com.ems.entity.Employee;
import com.ems.entity.PermissionRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PermissionRequestRepository extends JpaRepository<PermissionRequest, Long> {

    List<PermissionRequest> findByEmployeeOrderByCreatedAtDesc(Employee employee);

    List<PermissionRequest> findByStatusOrderByCreatedAtDesc(String status);
}
