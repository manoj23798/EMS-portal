package com.ems.repository;

import com.ems.entity.Employee;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface EmployeeRepository extends JpaRepository<Employee, Long> {
    Optional<Employee> findByEmployeeId(String employeeId);
    Optional<Employee> findByEmail(String email);
    boolean existsByEmail(String email);
    
    // For auto-generating employee IDs
    @org.springframework.data.jpa.repository.Query("SELECT MAX(e.id) FROM Employee e")
    Long findMaxId();
}
