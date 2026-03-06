package com.ems.dto.response;

import lombok.Data;

import java.time.LocalDate;

@Data
public class EmployeeResponse {
    private Long id;
    private String employeeId;
    private String firstName;
    private String lastName;
    private String email;
    private String phoneNumber;
    private LocalDate dateOfBirth;
    private String gender;
    private String address;
    private String departmentName;
    private String designationTitle;
    private String managerName;
    private LocalDate joiningDate;
    private String employmentType;
    private String status;
    private String profilePhotoUrl;
    private String emergencyContactName;
    private String emergencyContactPhone;
    private String workLocation;
    
    // Delta Fields
    private String aadhaar;
    private String pan;
    private String username;
    private String role;
}
