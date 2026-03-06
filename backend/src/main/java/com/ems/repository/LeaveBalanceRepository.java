package com.ems.repository;

import com.ems.entity.Employee;
import com.ems.entity.LeaveBalance;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface LeaveBalanceRepository extends JpaRepository<LeaveBalance, Long> {

    List<LeaveBalance> findByEmployeeAndYear(Employee employee, Integer year);

    Optional<LeaveBalance> findByEmployeeAndLeaveTypeAndYear(Employee employee, String leaveType, Integer year);
}
