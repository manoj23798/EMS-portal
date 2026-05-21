package com.ems.config;

import com.ems.entity.Employee.Employee;
import com.ems.entity.Employee.Role;
import com.ems.entity.Employee.User;
import com.ems.entity.Employee.Designation;
import com.ems.repository.Employee.DesignationRepository;
import com.ems.repository.Employee.EmployeeRepository;
import com.ems.repository.Employee.RoleRepository;
import com.ems.repository.Employee.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;

@Component
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private final RoleRepository roleRepository;
    private final DesignationRepository designationRepository;
    private final UserRepository userRepository;
    private final EmployeeRepository employeeRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    @Transactional
    public void run(String... args) throws Exception {
        // Seed Roles
        String[] roleNames = { "ADMIN", "HR", "EMPLOYEE", "PROJECT_MANAGER", "IT_MANAGER" };
        for (String roleName : roleNames) {
            if (roleRepository.findByRoleName(roleName).isEmpty()) {
                roleRepository.save(Role.builder()
                        .roleName(roleName)
                        .description(roleName + " Role")
                        .build());
            }
        }

        // Seed commonly used designations
        String[] designationTitles = {
                "QA Engineer",
                "Web Designer",
                "Business Analyst",
                "HR",
                ".NET Developer",
                "Java Developer",
                "System Admin"
        };

        for (String title : designationTitles) {
            if (designationRepository.findByTitle(title).isEmpty()) {
                Designation designation = new Designation();
                designation.setTitle(title);
                designationRepository.save(designation);
            }
        }

        // Seed an Admin Employee if none exists securely
        Role adminRole = roleRepository.findByRoleName("ADMIN").orElseThrow();
        User adminUser = userRepository.findByUsername("admin").orElseGet(User::new);

        // Check if there is already an employee 'admin' from legacy code we can link,
        // or create a mock one.
        Employee adminEmployee = employeeRepository.findByEmail("admin@company.com").orElseGet(() -> {
            Employee newEmp = new Employee();
            newEmp.setEmployeeId("EMP0001");
            newEmp.setFirstName("Super");
            newEmp.setLastName("Admin");
            newEmp.setEmail("admin@company.com");
            newEmp.setJoiningDate(LocalDate.now());
            newEmp.setStatus("ACTIVE");
            return employeeRepository.save(newEmp);
        });

        adminUser.setUsername("admin");
        adminUser.setEmail("admin@company.com");
        adminUser.setRole(adminRole);
        adminUser.setEmployee(adminEmployee);
        adminUser.setStatus("ACTIVE");
        if (adminUser.getPasswordHash() == null || adminUser.getPasswordHash().isBlank()) {
            adminUser.setPasswordHash(passwordEncoder.encode("admin123"));
        }

        userRepository.save(adminUser);
        System.out.println("✅ Database seeded with default ADMIN account. Username: admin, Password: admin123");
    }
}
