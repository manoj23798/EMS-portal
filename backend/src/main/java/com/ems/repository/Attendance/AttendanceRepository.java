package com.ems.repository.Attendance;

import com.ems.entity.Attendance.Attendance;
import com.ems.entity.Employee.Employee;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface AttendanceRepository extends JpaRepository<Attendance, Long> {

    Optional<Attendance> findByEmployeeAndDate(Employee employee, LocalDate date);

    List<Attendance> findByEmployeeOrderByDateDesc(Employee employee);

    List<Attendance> findByEmployeeAndDateBetweenOrderByDateDesc(Employee employee, LocalDate startDate,
            LocalDate endDate);

    // For Admin: Fetch all attendance for a specific date
    List<Attendance> findByDateOrderByEmployee_FirstName(LocalDate date);

    // For Admin: Fetch all attendance within a date range
    List<Attendance> findByDateBetweenOrderByDateDesc(LocalDate startDate, LocalDate endDate);

    // For checking "missing out-time" rule: find most recent attendance before a
    // given date
    Optional<Attendance> findTopByEmployeeAndDateBeforeOrderByDateDesc(Employee employee, LocalDate date);
}
