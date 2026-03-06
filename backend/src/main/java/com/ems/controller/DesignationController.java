package com.ems.controller;

import com.ems.dto.response.DesignationResponse;
import com.ems.entity.Designation;
import com.ems.repository.DesignationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/designations")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class DesignationController {
    private final DesignationRepository designationRepository;

    @GetMapping
    public ResponseEntity<List<DesignationResponse>> getAllDesignations() {
        List<DesignationResponse> res = designationRepository.findAll().stream().map(d -> {
            DesignationResponse dto = new DesignationResponse();
            dto.setId(d.getId());
            dto.setTitle(d.getTitle());
            if (d.getDepartment() != null) {
                dto.setDepartmentId(d.getDepartment().getId());
                dto.setDepartmentName(d.getDepartment().getName());
            }
            return dto;
        }).collect(Collectors.toList());
        return ResponseEntity.ok(res);
    }
}
