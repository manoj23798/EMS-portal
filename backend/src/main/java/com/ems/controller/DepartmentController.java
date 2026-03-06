package com.ems.controller;

import com.ems.dto.response.DepartmentResponse;
import com.ems.entity.Department;
import com.ems.repository.DepartmentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/departments")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class DepartmentController {
    private final DepartmentRepository departmentRepository;

    @GetMapping
    public ResponseEntity<List<DepartmentResponse>> getAllDepartments() {
        List<DepartmentResponse> res = departmentRepository.findAll().stream().map(d -> {
            DepartmentResponse dto = new DepartmentResponse();
            dto.setId(d.getId());
            dto.setName(d.getName());
            return dto;
        }).collect(Collectors.toList());
        return ResponseEntity.ok(res);
    }
}
