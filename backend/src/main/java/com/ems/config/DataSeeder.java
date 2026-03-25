package com.ems.config;

import com.ems.entity.Department;
import com.ems.entity.Designation;
import com.ems.entity.Employee;
import com.ems.entity.LeaveBalance;
import com.ems.repository.DepartmentRepository;
import com.ems.repository.DesignationRepository;
import com.ems.repository.EmployeeRepository;
import com.ems.repository.LeaveBalanceRepository;
import com.ems.entity.CommunicationType;
import com.ems.entity.Role;
import com.ems.entity.User;
import com.ems.repository.CommunicationTypeRepository;
import com.ems.repository.RoleRepository;
import com.ems.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
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
    private final CommunicationTypeRepository communicationTypeRepository;
    private final RoleRepository roleRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JdbcTemplate jdbcTemplate;

    @Override
    public void run(String... args) throws Exception {
        // Permanently remove the obsolete category_id column from the database
        try {
            jdbcTemplate.execute("ALTER TABLE handbook_policies DROP COLUMN IF EXISTS category_id CASCADE;");
            System.out.println("✅ Database Cleaned: category_id column has been removed.");
        } catch (Exception e) {
            System.out.println("ℹ️ Database Check: " + e.getMessage());
        }

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

        // Seed default Communication Types
        if (communicationTypeRepository.count() == 0) {
            String[] types = {"Memo", "Warning Letter", "Increment Letter", "General Announcement", "Offer Letter", "Policy Update"};
            for (String typeName : types) {
                CommunicationType ct = new CommunicationType();
                ct.setTypeName(typeName);
                communicationTypeRepository.save(ct);
            }
            System.out.println("Default Communication Types Seeded.");
        }

        // Seed Roles and Dummy Users
        seedRolesAndUsers();
    }

    private void createDesignation(String title, Department department) {
        Designation desig = new Designation();
        desig.setTitle(title);
        desig.setDepartment(department);
        designationRepository.save(desig);
    }

    private void seedRolesAndUsers() {
        String[] roleNames = {"ADMIN", "HR", "PROJECT_MANAGER", "IT_MANAGER", "EMPLOYEE"};
        List<String> roleList = List.of(roleNames);
        
        // Fetch departments and designations to link to dummies
        Department itDept = departmentRepository.findAll().stream().filter(d -> d.getName().equals("Engineering")).findFirst().orElse(null);
        Department hrDept = departmentRepository.findAll().stream().filter(d -> d.getName().equals("Human Resources")).findFirst().orElse(null);
        Department salesDept = departmentRepository.findAll().stream().filter(d -> d.getName().equals("Sales")).findFirst().orElse(null);

        Designation devOpsDesig = designationRepository.findAll().stream().filter(d -> d.getTitle().equals("DevOps Engineer")).findFirst().orElse(null);
        Designation hrManagerDesig = designationRepository.findAll().stream().filter(d -> d.getTitle().equals("HR Manager")).findFirst().orElse(null);
        Designation seniorDevDesig = designationRepository.findAll().stream().filter(d -> d.getTitle().equals("Senior Developer")).findFirst().orElse(null);
        Designation execDesig = designationRepository.findAll().stream().filter(d -> d.getTitle().equals("Sales Executive")).findFirst().orElse(null);

        // Seed Roles
        for (String roleName : roleNames) {
            roleRepository.findByRoleName(roleName).orElseGet(() -> {
                Role role = new Role();
                role.setRoleName(roleName);
                role.setDescription(roleName + " Role");
                return roleRepository.save(role);
            });
        }

        // Seed Dummy Users for each Role
        String defaultPassword = passwordEncoder.encode("password123");
        for (String roleName : roleNames) {
            String username = roleName.toLowerCase() + "_user";
            
            if (userRepository.findByUsername(username).isEmpty()) {
                Role role = roleRepository.findByRoleName(roleName).orElseThrow();
                
                Department empDept = null;
                Designation empDesig = null;
                String gender = "Male";
                
                switch(roleName) {
                    case "ADMIN": empDept = itDept; empDesig = devOpsDesig; break;
                    case "HR": empDept = hrDept; empDesig = hrManagerDesig; gender = "Female"; break;
                    case "PROJECT_MANAGER": empDept = itDept; empDesig = seniorDevDesig; break;
                    case "IT_MANAGER": empDept = itDept; empDesig = devOpsDesig; break;
                    case "EMPLOYEE": empDept = salesDept; empDesig = execDesig; gender = "Female"; break;
                }

                int index = roleList.indexOf(roleName);

                // 1. Create Employee
                Employee emp = new Employee();
                emp.setEmployeeId("EMP_" + roleName);
                emp.setFirstName("Dummy");
                emp.setLastName(roleName);
                emp.setEmail(username + "@example.com");
                emp.setPhoneNumber("987654321" + index);
                emp.setDateOfBirth(LocalDate.of(1990, 1, 1).plusYears(index));
                emp.setGender(gender);
                emp.setAddress("123 Tech Park, Innovation Block, Suite " + (100 + index));
                emp.setDepartment(empDept);
                emp.setDesignation(empDesig);
                emp.setEmploymentType("Full-Time");
                emp.setWorkLocation("Headquarters");
                emp.setEmergencyContactName("Emergency " + roleName);
                emp.setEmergencyContactPhone("112233445" + index);
                emp.setAadhaar("12341234123" + index);
                emp.setPan("ABCDE1234" + index);
                emp.setJoiningDate(LocalDate.now().minusYears(1));
                emp.setStatus("ACTIVE");
                emp = employeeRepository.save(emp);

                // 1.5 Create Leave Balances for the dummy employee
                int currentYear = LocalDate.now().getYear();
                String[] leaveTypes = {"Casual Leave", "Sick Leave", "Paid Leave", "Unpaid Leave", "Work From Home"};
                int[] defaultAllotments = {12, 10, 15, 0, 20};
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

                // 2. Create User linked to Employee
                User user = User.builder()
                        .username(username)
                        .email(emp.getEmail())
                        .passwordHash(defaultPassword)
                        .role(role)
                        .employee(emp)
                        .status("ACTIVE")
                        .build();
                userRepository.save(user);
                
                System.out.println("Created Dummy User: " + username + " with password: password123");
            }
        }
    }
}
