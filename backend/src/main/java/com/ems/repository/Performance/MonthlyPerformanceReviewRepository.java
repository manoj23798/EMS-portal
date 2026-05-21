package com.ems.repository.Performance;

import com.ems.entity.Performance.MonthlyPerformanceReview;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface MonthlyPerformanceReviewRepository extends JpaRepository<MonthlyPerformanceReview, Long> {
    List<MonthlyPerformanceReview> findByEmployeeId(Long employeeId);
    List<MonthlyPerformanceReview> findByEmployeeIdAndYear(Long employeeId, Integer year);
    List<MonthlyPerformanceReview> findByMonthAndYear(Integer month, Integer year);

    @org.springframework.data.jpa.repository.Query("SELECT r FROM MonthlyPerformanceReview r WHERE r.employeeId IN (SELECT e.id FROM Employee e WHERE e.manager.id = :managerId)")
    List<MonthlyPerformanceReview> findByManagerId(@org.springframework.data.repository.query.Param("managerId") Long managerId);
}
