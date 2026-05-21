package com.ems.service.implementation;

import com.ems.dto.request.EmployeeCreateRequest;
import com.ems.dto.response.EmployeeResponse;
import com.ems.entity.Employee.Department;
import com.ems.entity.Employee.Designation;
import com.ems.entity.Employee.Employee;
import com.ems.entity.Employee.User;
import com.ems.entity.Employee.Role;
import com.ems.exception.ResourceNotFoundException;
import com.ems.repository.Employee.DepartmentRepository;
import com.ems.repository.Employee.DesignationRepository;
import com.ems.repository.Employee.EmployeeRepository;
import com.ems.repository.Employee.RoleRepository;
import com.ems.repository.Employee.UserRepository;
import com.ems.service.Interface.EmployeeService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class EmployeeServiceImpl implements EmployeeService {

    private final EmployeeRepository employeeRepository;
    private final DepartmentRepository departmentRepository;
    private final DesignationRepository designationRepository;
    private final RoleRepository roleRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    @Transactional
    public EmployeeResponse createEmployee(EmployeeCreateRequest request) {
        if (request.getEmail() != null && !request.getEmail().isBlank() 
                && employeeRepository.existsByEmail(request.getEmail())) {
            throw new IllegalArgumentException("Email already exists");
        }

        Employee employee = new Employee();
        employee.setEmployeeId(generateEmployeeId());

        mapRequestToEntity(request, employee);

        Employee saved = employeeRepository.save(employee);

        // Create User entity if auth details are provided
        if (request.getUsername() != null && !request.getUsername().isEmpty()) {
            String roleName = request.getRole() != null && !request.getRole().isBlank()
                    ? request.getRole()
                    : "Employee";
            Role role = roleRepository.findByRoleName(roleName)
                    .orElseGet(() -> roleRepository.findByRoleName("EMPLOYEE")
                            .orElseThrow(() -> new ResourceNotFoundException("Role not found")));

            User user = User.builder()
                    .username(request.getUsername())
                    .email(request.getEmail())
                    .passwordHash(passwordEncoder
                            .encode(request.getPassword() != null ? request.getPassword() : "default123"))
                    .role(role)
                    .employee(saved)
                    .status("ACTIVE")
                    .build();
            userRepository.save(user);
        }

        return mapEntityToResponse(saved);
    }

    @Override
    public List<EmployeeResponse> getAllEmployees() {
        return employeeRepository.findAll().stream()
                .map(this::mapEntityToResponse)
                .collect(Collectors.toList());
    }

    @Override
    public EmployeeResponse getEmployeeById(Long id) {
        Employee employee = employeeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Employee not found"));
        return mapEntityToResponse(employee);
    }

    @Override
    @Transactional
    public EmployeeResponse updateEmployee(Long id, EmployeeCreateRequest request) {
        Employee employee = employeeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Employee not found"));

        mapRequestToEntity(request, employee);

        Employee updated = employeeRepository.save(employee);

        // Update User entity if it exists or create one
        if (request.getUsername() != null && !request.getUsername().isEmpty()) {
            User user = userRepository.findByEmployeeId(updated.getId()).orElse(new User());
            user.setUsername(request.getUsername());
            user.setEmail(request.getEmail());
            user.setEmployee(updated);
            user.setStatus(updated.getStatus());

            if (request.getRole() != null && !request.getRole().isBlank()) {
                Role role = roleRepository.findByRoleName(request.getRole())
                        .orElseGet(() -> roleRepository.findByRoleName("EMPLOYEE")
                                .orElseThrow(() -> new ResourceNotFoundException("Role not found")));
                user.setRole(role);
            }

            if (request.getPassword() != null && !request.getPassword().isEmpty()) {
                user.setPasswordHash(passwordEncoder.encode(request.getPassword()));
            }

            // If it's a new user where role wasn't provided, default it
            if (user.getId() == null && user.getRole() == null) {
                Role role = roleRepository.findByRoleName("Employee")
                        .orElseGet(() -> roleRepository.findByRoleName("EMPLOYEE")
                                .orElseThrow(() -> new ResourceNotFoundException("Role not found")));
                user.setRole(role);
            }

            userRepository.save(user);
        }

        return mapEntityToResponse(updated);
    }

    @Override
    @Transactional
    public void deactivateEmployee(Long id) {
        Employee employee = employeeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Employee not found"));
        employee.setStatus("INACTIVE");
        employeeRepository.save(employee);
    }

    @Override
    public List<EmployeeResponse> searchEmployees(String query) {
        return employeeRepository.searchEmployees(query).stream()
                .map(this::mapEntityToResponse)
                .collect(Collectors.toList());
    }

    private String generateEmployeeId() {
        Long maxId = employeeRepository.findMaxId();
        long nextId = (maxId == null ? 0 : maxId) + 1;
        return String.format("EMP%04d", nextId); // Requirement is EMP0001
    }

    private void mapRequestToEntity(EmployeeCreateRequest request, Employee employee) {
        if (request.getFirstName() != null && !request.getFirstName().isBlank()) {
            employee.setFirstName(request.getFirstName());
        }
        if (request.getLastName() != null && !request.getLastName().isBlank()) {
            employee.setLastName(request.getLastName());
        }
        if (request.getEmail() != null && !request.getEmail().isBlank()) {
            employee.setEmail(request.getEmail());
        }
        if (request.getPhoneNumber() != null) {
            employee.setPhoneNumber(request.getPhoneNumber());
        }
        if (request.getDateOfBirth() != null) {
            employee.setDateOfBirth(request.getDateOfBirth());
        }
        if (request.getGender() != null) {
            employee.setGender(request.getGender());
        }
        if (request.getAddress() != null) {
            employee.setAddress(request.getAddress());
        }
        if (request.getJoiningDate() != null) {
            employee.setJoiningDate(request.getJoiningDate());
        }
        if (request.getEmploymentType() != null) {
            employee.setEmploymentType(request.getEmploymentType());
        }
        if (request.getProfilePhotoUrl() != null) {
            employee.setProfilePhotoUrl(request.getProfilePhotoUrl());
        }
        if (request.getEmergencyContactName() != null) {
            employee.setEmergencyContactName(request.getEmergencyContactName());
        }
        if (request.getEmergencyContactPhone() != null) {
            employee.setEmergencyContactPhone(request.getEmergencyContactPhone());
        }
        if (request.getWorkLocation() != null) {
            employee.setWorkLocation(request.getWorkLocation());
        }

        if (request.getStatus() != null && !request.getStatus().isBlank()) {
            employee.setStatus(request.getStatus().toUpperCase());
        }

        if (request.getAadhaar() != null) {
            employee.setAadhaar(normalizeOptional(request.getAadhaar()));
        }
        if (request.getPan() != null) {
            String normalizedPan = normalizeOptional(request.getPan());
            employee.setPan(normalizedPan != null ? normalizedPan.toUpperCase() : null);
        }

        if (request.getDepartmentId() != null) {
            Department dept = departmentRepository.findById(request.getDepartmentId())
                    .orElseThrow(() -> new ResourceNotFoundException("Department not found"));
            employee.setDepartment(dept);
        }

        if (request.getDesignationId() != null) {
            Designation desig = designationRepository.findById(request.getDesignationId())
                    .orElseThrow(() -> new ResourceNotFoundException("Designation not found"));
            employee.setDesignation(desig);
        }

        if (request.getManagerId() != null) {
            Employee manager = employeeRepository.findById(request.getManagerId())
                    .orElseThrow(() -> new ResourceNotFoundException("Manager not found"));
            employee.setManager(manager);
        }
    }

    private String normalizeOptional(String value) {
        if (value == null)
            return null;
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    private EmployeeResponse mapEntityToResponse(Employee employee) {
        EmployeeResponse response = new EmployeeResponse();
        response.setId(employee.getId());
        response.setEmployeeId(employee.getEmployeeId());
        response.setFirstName(employee.getFirstName());
        response.setLastName(employee.getLastName());
        response.setEmail(employee.getEmail());
        response.setPhoneNumber(employee.getPhoneNumber());
        response.setDateOfBirth(employee.getDateOfBirth());
        response.setGender(employee.getGender());
        response.setAddress(employee.getAddress());
        response.setJoiningDate(employee.getJoiningDate());
        response.setEmploymentType(employee.getEmploymentType());
        response.setStatus(employee.getStatus());
        response.setProfilePhotoUrl(employee.getProfilePhotoUrl());
        response.setEmergencyContactName(employee.getEmergencyContactName());
        response.setEmergencyContactPhone(employee.getEmergencyContactPhone());
        response.setWorkLocation(employee.getWorkLocation());
        response.setAadhaar(employee.getAadhaar());
        response.setPan(employee.getPan());

        userRepository.findByEmployeeId(employee.getId()).ifPresent(user -> {
            response.setUsername(user.getUsername());
            response.setRole(user.getRole() != null ? user.getRole().getRoleName() : null);
        });

        if (employee.getDepartment() != null) {
            response.setDepartmentName(employee.getDepartment().getName());
        }
        if (employee.getDesignation() != null) {
            response.setDesignationTitle(employee.getDesignation().getTitle());
        }
        if (employee.getManager() != null) {
            response.setManagerName(employee.getManager().getFirstName() + " " + employee.getManager().getLastName());
        }

        return response;
    }
}
