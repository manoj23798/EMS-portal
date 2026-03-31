package com.ems.controller;

import com.ems.dto.request.CommunicationCreateRequest;
import com.ems.dto.response.CommunicationResponse;
import com.ems.dto.response.CommunicationTypeResponse;
import com.ems.service.CommunicationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import com.ems.entity.CommunicationType;
import com.ems.repository.CommunicationTypeRepository;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class CommunicationController {

    private final CommunicationService communicationService;
    private final CommunicationTypeRepository communicationTypeRepository;

    // ===================== ADMIN / HR ENDPOINTS =====================

    @PostMapping("/admin/communications")
    public ResponseEntity<CommunicationResponse> createCommunication(
            @Valid @ModelAttribute CommunicationCreateRequest request,
            @RequestParam(value = "file", required = false) MultipartFile file) {
        
        // Using ModelAttribute because we are receiving multipart/form-data
        return new ResponseEntity<>(communicationService.createCommunication(request, file), HttpStatus.CREATED);
    }

    @GetMapping("/admin/communications")
    public ResponseEntity<List<CommunicationResponse>> getAllCommunicationsAdmin() {
        return ResponseEntity.ok(communicationService.getAllCommunicationsAdmin());
    }

    @GetMapping("/admin/communications/{id}")
    public ResponseEntity<CommunicationResponse> getCommunicationByIdForAdmin(@PathVariable("id") Long id) {
        return ResponseEntity.ok(communicationService.getCommunicationByIdForAdmin(id));
    }

    @DeleteMapping("/admin/communications/{id}")
    public ResponseEntity<Void> deleteCommunication(@PathVariable("id") Long id) {
        communicationService.deleteCommunication(id);
        return ResponseEntity.noContent().build();
    }

    // ===================== EMPLOYEE ENDPOINTS =====================

    @GetMapping("/communications/my")
    public ResponseEntity<List<CommunicationResponse>> getMyCommunications(@RequestParam("employeeId") Long employeeId) {
        return ResponseEntity.ok(communicationService.getMyCommunications(employeeId));
    }

    @GetMapping("/communications/{id}")
    public ResponseEntity<CommunicationResponse> getCommunicationByIdForEmployee(
            @PathVariable("id") Long id, 
            @RequestParam("employeeId") Long employeeId) {
        return ResponseEntity.ok(communicationService.getCommunicationByIdForEmployee(id, employeeId));
    }
    
    // ===================== TYPES ENDPOINT =====================
    
    @GetMapping("/communications/types")
    public ResponseEntity<List<CommunicationTypeResponse>> getCommunicationTypes() {
        return ResponseEntity.ok(communicationService.getAllCommunicationTypes());
    }

    @GetMapping("/seed-types")
    public ResponseEntity<String> seedTypes() {
        if (communicationTypeRepository.count() == 0) {
            String[] types = {"Memo", "Warning Letter", "Increment Letter", "General Announcement", "Offer Letter", "Policy Update"};
            for (String typeName : types) {
                CommunicationType ct = new CommunicationType();
                ct.setTypeName(typeName);
                communicationTypeRepository.save(ct);
            }
            return ResponseEntity.ok("Seeded " + types.length + " types");
        }
        return ResponseEntity.ok("Already seeded: " + communicationTypeRepository.count());
    }
}
