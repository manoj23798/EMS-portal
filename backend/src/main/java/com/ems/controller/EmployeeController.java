package com.ems.controller;

import com.ems.dto.request.EmployeeCreateRequest;
import com.ems.dto.response.EmployeeResponse;
import com.ems.entity.Employee;
import com.ems.entity.EmployeeDocument;
import com.ems.repository.EmployeeDocumentRepository;
import com.ems.repository.EmployeeRepository;
import com.ems.service.EmployeeService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/employees")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class EmployeeController {

    private final EmployeeService employeeService;
    private final EmployeeRepository employeeRepository;
    private final EmployeeDocumentRepository employeeDocumentRepository;

    @PostMapping
    public ResponseEntity<EmployeeResponse> createEmployee(@Valid @RequestBody EmployeeCreateRequest request) {
        return new ResponseEntity<>(employeeService.createEmployee(request), HttpStatus.CREATED);
    }

    @GetMapping
    public ResponseEntity<List<EmployeeResponse>> getAllEmployees() {
        return ResponseEntity.ok(employeeService.getAllEmployees());
    }

    @GetMapping("/{id}")
    public ResponseEntity<EmployeeResponse> getEmployeeById(@PathVariable Long id) {
        return ResponseEntity.ok(employeeService.getEmployeeById(id));
    }

    @PutMapping("/{id}")
    public ResponseEntity<EmployeeResponse> updateEmployee(@PathVariable Long id, @Valid @RequestBody EmployeeCreateRequest request) {
        return ResponseEntity.ok(employeeService.updateEmployee(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deactivateEmployee(@PathVariable Long id) {
        employeeService.deactivateEmployee(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/documents")
    public ResponseEntity<?> uploadDocument(@PathVariable Long id,
                                            @RequestParam("file") MultipartFile file,
                                            @RequestParam("documentType") String documentType) {
        Employee employee = employeeRepository.findById(id).orElse(null);
        if (employee == null) {
            return ResponseEntity.notFound().build();
        }

        try {
            String fileName = StringUtils.cleanPath(file.getOriginalFilename());
            // Make unique filename
            fileName = System.currentTimeMillis() + "_" + fileName;
            
            Path uploadPath = Paths.get("uploads");
            if (!Files.exists(uploadPath)) {
                Files.createDirectories(uploadPath);
            }
            
            try (InputStream inputStream = file.getInputStream()) {
                Path filePath = uploadPath.resolve(fileName);
                Files.copy(inputStream, filePath, StandardCopyOption.REPLACE_EXISTING);
            }
            
            String fileUrl = "/uploads/" + fileName;

            if ("PROFILE_PHOTO".equals(documentType)) {
                employee.setProfilePhotoUrl(fileUrl);
                employeeRepository.save(employee);
            } else {
                EmployeeDocument doc = new EmployeeDocument();
                doc.setEmployee(employee);
                doc.setDocumentType(documentType);
                doc.setDocumentUrl(fileUrl);
                employeeDocumentRepository.save(doc);
            }

            Map<String, String> response = new HashMap<>();
            response.put("url", fileUrl);
            return ResponseEntity.ok(response);
            
        } catch (IOException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Could not upload file");
        }
    }
    
    @GetMapping("/{id}/documents")
    public ResponseEntity<?> getEmployeeDocuments(@PathVariable Long id) {
        List<EmployeeDocument> docs = employeeDocumentRepository.findByEmployeeId(id);
        return ResponseEntity.ok(docs);
    }
}
