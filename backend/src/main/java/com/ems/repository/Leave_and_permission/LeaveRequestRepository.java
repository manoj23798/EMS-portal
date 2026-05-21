package com.ems.repository.Leave_and_permission;

import com.ems.entity.Employee.Employee;
import com.ems.entity.leave_And_permission.LeaveRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface LeaveRequestRepository extends JpaRepository<LeaveRequest, Long> {

       List<LeaveRequest> findByEmployeeOrderByCreatedAtDesc(Employee employee);

       List<LeaveRequest> findByEmployee(Employee employee);

       List<LeaveRequest> findByStatusOrderByCreatedAtDesc(String status);

       // For detecting overlapping leave requests
       @Query("SELECT lr FROM LeaveRequest lr WHERE lr.employee = :employee AND lr.status NOT IN ('Rejected', 'Canceled') "
                     +
                     "AND ((lr.startDate <= :endDate AND lr.endDate >= :startDate))")
       List<LeaveRequest> findOverlapping(@Param("employee") Employee employee,
                     @Param("startDate") LocalDate startDate,
                     @Param("endDate") LocalDate endDate);

       @Query("SELECT lr FROM LeaveRequest lr WHERE lr.employee = :employee AND lr.status = 'Approved' "
                     + "AND lr.startDate <= :endDate AND lr.endDate >= :startDate")
       List<LeaveRequest> findApprovedOverlapping(@Param("employee") Employee employee,
                     @Param("startDate") LocalDate startDate,
                     @Param("endDate") LocalDate endDate);
}
