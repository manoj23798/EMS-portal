package com.ems.repository.Employee;

import com.ems.entity.Employee.Employee;
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

    @org.springframework.data.jpa.repository.Query("SELECT e FROM Employee e WHERE (LOWER(e.firstName) LIKE LOWER(CONCAT('%', :query, '%')) OR LOWER(e.lastName) LIKE LOWER(CONCAT('%', :query, '%')) OR LOWER(e.employeeId) LIKE LOWER(CONCAT('%', :query, '%'))) AND e.status = 'ACTIVE'")
    java.util.List<Employee> searchEmployees(@org.springframework.data.repository.query.Param("query") String query);
}
