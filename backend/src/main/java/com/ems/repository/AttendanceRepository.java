package com.ems.repository;

import com.ems.entity.Attendance;
import com.ems.entity.Employee;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface AttendanceRepository extends JpaRepository<Attendance, Long> {

    Optional<Attendance> findByEmployeeAndDate(Employee employee, LocalDate date);

    List<Attendance> findByEmployeeOrderByDateDesc(Employee employee);
    
    @Query("SELECT a FROM Attendance a WHERE a.employee = :employee AND a.date >= :startDate AND a.date <= :endDate ORDER BY a.date DESC")
    List<Attendance> findByEmployeeAndDateBetweenOrderByDateDesc(@Param("employee") Employee employee, @Param("startDate") LocalDate startDate, @Param("endDate") LocalDate endDate);

    // For Admin: Fetch all attendance for a specific date
    List<Attendance> findByDateOrderByEmployee_FirstName(LocalDate date);
    
    // For Admin: Fetch all attendance within a date range
    List<Attendance> findByDateBetweenOrderByDateDesc(LocalDate startDate, LocalDate endDate);
    
    // For checking "missing out-time" rule: Find most recent attendance before a given date
    @Query("SELECT a FROM Attendance a WHERE a.employee = :employee AND a.date < :date ORDER BY a.date DESC LIMIT 1")
    Optional<Attendance> findTopByEmployeeAndDateBeforeOrderByDateDesc(@Param("employee") Employee employee, @Param("date") LocalDate date);
}
