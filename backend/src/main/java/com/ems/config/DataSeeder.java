package com.ems.config;

import com.ems.entity.Department;
import com.ems.entity.Designation;
import com.ems.entity.Employee;
import com.ems.entity.LeaveBalance;
import com.ems.repository.DepartmentRepository;
import com.ems.repository.DesignationRepository;
import com.ems.repository.EmployeeRepository;
import com.ems.repository.LeaveBalanceRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.util.List;

@Component
@RequiredArgsConstructor
public class DataSeeder implements CommandLineRunner {

    private final DepartmentRepository departmentRepository;
    private final DesignationRepository designationRepository;
    private final EmployeeRepository employeeRepository;
    private final LeaveBalanceRepository leaveBalanceRepository;

    @Override
    public void run(String... args) throws Exception {
        // Seed departments and designations
        if (departmentRepository.count() == 0) {
            Department hr = new Department();
            hr.setName("Human Resources");
            hr = departmentRepository.save(hr);

            Department it = new Department();
            it.setName("Engineering");
            it = departmentRepository.save(it);

            Department sales = new Department();
            sales.setName("Sales");
            sales = departmentRepository.save(sales);

            createDesignation("HR Manager", hr);
            createDesignation("Recruiter", hr);
            createDesignation("Software Engineer", it);
            createDesignation("Senior Developer", it);
            createDesignation("DevOps Engineer", it);
            createDesignation("Sales Executive", sales);
            createDesignation("Account Manager", sales);

            System.out.println("Dummy Departments and Designations Seeded.");
        }

        // Seed leave balances for existing employees
        if (leaveBalanceRepository.count() == 0) {
            int currentYear = LocalDate.now().getYear();
            List<Employee> employees = employeeRepository.findAll();
            String[] leaveTypes = {"Casual Leave", "Sick Leave", "Paid Leave", "Unpaid Leave", "Work From Home"};
            int[] defaultAllotments = {12, 10, 15, 0, 20}; // days per year

            for (Employee emp : employees) {
                for (int i = 0; i < leaveTypes.length; i++) {
                    LeaveBalance balance = LeaveBalance.builder()
                            .employee(emp)
                            .leaveType(leaveTypes[i])
                            .totalLeaves(defaultAllotments[i])
                            .usedLeaves(0)
                            .remainingLeaves(defaultAllotments[i])
                            .year(currentYear)
                            .build();
                    leaveBalanceRepository.save(balance);
                }
            }
            if (!employees.isEmpty()) {
                System.out.println("Leave balances seeded for " + employees.size() + " employees.");
            }
        }
    }

    private void createDesignation(String title, Department department) {
        Designation desig = new Designation();
        desig.setTitle(title);
        desig.setDepartment(department);
        designationRepository.save(desig);
    }
}
