package com.ems.config;

import com.ems.entity.Employee;
import com.ems.entity.Role;
import com.ems.entity.User;
import com.ems.repository.EmployeeRepository;
import com.ems.repository.RoleRepository;
import com.ems.repository.UserRepository;
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
    private final UserRepository userRepository;
    private final EmployeeRepository employeeRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    @Transactional
    public void run(String... args) throws Exception {
        // Seed Roles
        String[] roleNames = {"ADMIN", "HR", "EMPLOYEE", "PROJECT_MANAGER", "IT_MANAGER"};
        for (String roleName : roleNames) {
            if (roleRepository.findByRoleName(roleName).isEmpty()) {
                roleRepository.save(Role.builder()
                        .roleName(roleName)
                        .description(roleName + " Role")
                        .build());
            }
        }

        // Seed an Admin Employee if none exists securely
        if (userRepository.findByUsername("admin").isEmpty()) {
            Role adminRole = roleRepository.findByRoleName("ADMIN").get();

            // Check if there is already an employee 'admin' from legacy code we can link, or create a mock one.
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

            User adminUser = User.builder()
                    .username("admin")
                    .email("admin@company.com")
                    .passwordHash(passwordEncoder.encode("admin123")) // Default password
                    .role(adminRole)
                    .employee(adminEmployee)
                    .status("ACTIVE")
                    .build();

            userRepository.save(adminUser);
            System.out.println("✅ Database seeded with default ADMIN account. Username: admin, Password: admin123");
        }
    }
}
