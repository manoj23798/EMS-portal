package com.ems.service.impl;

import com.ems.dto.request.EmployeeCreateRequest;
import com.ems.dto.response.EmployeeResponse;
import com.ems.entity.Department;
import com.ems.entity.Designation;
import com.ems.entity.Employee;
import com.ems.entity.User;
import com.ems.entity.Role;
import com.ems.repository.DepartmentRepository;
import com.ems.repository.DesignationRepository;
import com.ems.repository.EmployeeRepository;
import com.ems.repository.RoleRepository;
import com.ems.repository.UserRepository;
import com.ems.service.EmployeeService;
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
        if (employeeRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Email already exists");
        }

        Employee employee = new Employee();
        employee.setEmployeeId(generateEmployeeId());
        
        mapRequestToEntity(request, employee);
        
        Employee saved = employeeRepository.save(employee);
        
        // Create User entity if auth details are provided
        if (request.getUsername() != null && !request.getUsername().isEmpty()) {
            Role role = roleRepository.findByRoleName(request.getRole() != null ? request.getRole() : "EMPLOYEE")
                    .orElseThrow(() -> new RuntimeException("Role not found"));
            
            User user = User.builder()
                    .username(request.getUsername())
                    .email(request.getEmail())
                    .passwordHash(passwordEncoder.encode(request.getPassword() != null ? request.getPassword() : "default123"))
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
                .orElseThrow(() -> new RuntimeException("Employee not found"));
        return mapEntityToResponse(employee);
    }

    @Override
    @Transactional
    public EmployeeResponse updateEmployee(Long id, EmployeeCreateRequest request) {
        Employee employee = employeeRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Employee not found"));
        
        mapRequestToEntity(request, employee);
        
        Employee updated = employeeRepository.save(employee);
        
        // Update User entity if it exists or create one
        if (request.getUsername() != null && !request.getUsername().isEmpty()) {
            User user = userRepository.findByEmployeeId(updated.getId()).orElse(new User());
            user.setUsername(request.getUsername());
            user.setEmail(request.getEmail());
            user.setEmployee(updated);
            user.setStatus(updated.getStatus());
            
            if (request.getRole() != null) {
                Role role = roleRepository.findByRoleName(request.getRole())
                        .orElseThrow(() -> new RuntimeException("Role not found"));
                user.setRole(role);
            }
            
            if (request.getPassword() != null && !request.getPassword().isEmpty()) {
                user.setPasswordHash(passwordEncoder.encode(request.getPassword()));
            }
            
            // If it's a new user where role wasn't provided, default it
            if (user.getId() == null && user.getRole() == null) {
                Role role = roleRepository.findByRoleName("EMPLOYEE")
                        .orElseThrow(() -> new RuntimeException("Role not found"));
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
                .orElseThrow(() -> new RuntimeException("Employee not found"));
        employee.setStatus("INACTIVE");
        employeeRepository.save(employee);
    }

    private String generateEmployeeId() {
        Long maxId = employeeRepository.findMaxId();
        long nextId = (maxId == null ? 0 : maxId) + 1;
        return String.format("EMP%04d", nextId); // Requirement is EMP0001
    }

    private void mapRequestToEntity(EmployeeCreateRequest request, Employee employee) {
        employee.setFirstName(request.getFirstName());
        employee.setLastName(request.getLastName());
        employee.setEmail(request.getEmail());
        employee.setPhoneNumber(request.getPhoneNumber());
        employee.setDateOfBirth(request.getDateOfBirth());
        employee.setGender(request.getGender());
        employee.setAddress(request.getAddress());
        employee.setJoiningDate(request.getJoiningDate());
        employee.setEmploymentType(request.getEmploymentType());
        employee.setProfilePhotoUrl(request.getProfilePhotoUrl());
        employee.setEmergencyContactName(request.getEmergencyContactName());
        employee.setEmergencyContactPhone(request.getEmergencyContactPhone());
        employee.setWorkLocation(request.getWorkLocation());

        // Delta fields
        // Delta fields
        employee.setAadhaar(request.getAadhaar());
        employee.setPan(request.getPan());

        if (request.getDepartmentId() != null) {
            Department dept = departmentRepository.findById(request.getDepartmentId())
                    .orElseThrow(() -> new RuntimeException("Department not found"));
            employee.setDepartment(dept);
        }

        if (request.getDesignationId() != null) {
            Designation desig = designationRepository.findById(request.getDesignationId())
                    .orElseThrow(() -> new RuntimeException("Designation not found"));
            employee.setDesignation(desig);
        }

        if (request.getManagerId() != null) {
            Employee manager = employeeRepository.findById(request.getManagerId())
                    .orElseThrow(() -> new RuntimeException("Manager not found"));
            employee.setManager(manager);
        }
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
