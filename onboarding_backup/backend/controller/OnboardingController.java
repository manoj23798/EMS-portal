package com.ems.controller;

import com.ems.dto.request.InductionFeedbackRequest;
import com.ems.dto.response.InductionFeedbackResponse;
import com.ems.dto.response.OnboardingChecklistResponse;
import com.ems.dto.response.OnboardingDocumentResponse;
import com.ems.dto.response.OnboardingResponse;
import com.ems.service.OnboardingService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:5173")
public class OnboardingController {

    private final OnboardingService onboardingService;

    // ===================== ADMIN / HR ENDPOINTS =====================

    @PostMapping("/admin/onboarding/start")
    public ResponseEntity<OnboardingResponse> startOnboarding(@RequestParam Long employeeId) {
        return ResponseEntity.ok(onboardingService.startOnboarding(employeeId));
    }

    @GetMapping("/admin/onboarding")
    public ResponseEntity<List<OnboardingResponse>> getAllOnboardings() {
        return ResponseEntity.ok(onboardingService.getAllOnboardings());
    }

    @PutMapping("/admin/onboarding/verify-document")
    public ResponseEntity<OnboardingDocumentResponse> verifyDocument(
            @RequestParam Long documentId,
            @RequestParam Long hrId,
            @RequestParam String status) { // "Approved" or "Rejected"
        return ResponseEntity.ok(onboardingService.verifyDocument(documentId, hrId, status));
    }

    @GetMapping("/admin/onboarding/feedback")
    public ResponseEntity<List<InductionFeedbackResponse>> getAllFeedback() {
        return ResponseEntity.ok(onboardingService.getAllFeedback());
    }

    // ===================== EMPLOYEE ENDPOINTS =====================

    @GetMapping("/onboarding/my")
    public ResponseEntity<OnboardingResponse> getMyOnboarding(@RequestParam Long employeeId) {
        return ResponseEntity.ok(onboardingService.getMyOnboarding(employeeId));
    }

    @PostMapping("/onboarding/upload-document")
    public ResponseEntity<OnboardingDocumentResponse> uploadDocument(
            @RequestParam Long employeeId,
            @RequestParam String documentType,
            @RequestParam("file") MultipartFile file) {
        return ResponseEntity.ok(onboardingService.uploadDocument(employeeId, documentType, file));
    }

    @GetMapping("/onboarding/my-documents")
    public ResponseEntity<List<OnboardingDocumentResponse>> getMyDocuments(@RequestParam Long employeeId) {
        return ResponseEntity.ok(onboardingService.getMyDocuments(employeeId));
    }

    @GetMapping("/onboarding/checklist")
    public ResponseEntity<List<OnboardingChecklistResponse>> getMyChecklist(@RequestParam Long employeeId) {
        return ResponseEntity.ok(onboardingService.getMyChecklist(employeeId));
    }

    @PutMapping("/onboarding/checklist/update")
    public ResponseEntity<OnboardingChecklistResponse> updateChecklistTask(
            @RequestParam Long taskId,
            @RequestParam Long employeeId,
            @RequestBody Map<String, String> body) {
        String status = body.get("status"); // "In Progress" or "Completed"
        return ResponseEntity.ok(onboardingService.updateChecklistTask(taskId, employeeId, status));
    }

    @PostMapping("/onboarding/feedback")
    public ResponseEntity<InductionFeedbackResponse> submitFeedback(@Valid @RequestBody InductionFeedbackRequest request) {
        return ResponseEntity.ok(onboardingService.submitFeedback(request));
    }

    @GetMapping("/onboarding/my-feedback")
    public ResponseEntity<InductionFeedbackResponse> getMyFeedback(@RequestParam Long employeeId) {
        return ResponseEntity.ok(onboardingService.getMyFeedback(employeeId));
    }
}
