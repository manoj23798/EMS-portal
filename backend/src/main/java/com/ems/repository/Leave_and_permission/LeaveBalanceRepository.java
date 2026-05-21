package com.ems.repository.Leave_and_permission;

import com.ems.entity.Employee.Employee;
import com.ems.entity.leave_And_permission.LeaveBalance;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface LeaveBalanceRepository extends JpaRepository<LeaveBalance, Long> {

    List<LeaveBalance> findByEmployeeAndYear(Employee employee, Integer year);

    Optional<LeaveBalance> findByEmployeeAndLeaveTypeAndYear(Employee employee, String leaveType, Integer year);

    void deleteByEmployeeAndYearAndLeaveTypeNot(Employee employee, Integer year, String leaveType);
}
