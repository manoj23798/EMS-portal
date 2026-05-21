package com.ems.service.Interface;

import com.ems.dto.request.EmployeeCreateRequest;
import com.ems.dto.response.EmployeeResponse;

import java.util.List;

public interface EmployeeService {
    EmployeeResponse createEmployee(EmployeeCreateRequest request);
    List<EmployeeResponse> getAllEmployees();
    EmployeeResponse getEmployeeById(Long id);
    EmployeeResponse updateEmployee(Long id, EmployeeCreateRequest request);
    void deactivateEmployee(Long id);
    List<EmployeeResponse> searchEmployees(String query);
}
