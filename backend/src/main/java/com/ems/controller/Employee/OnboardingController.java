package com.ems.controller.Employee;

import com.ems.entity.Employee.*;
import com.ems.repository.Employee.UserRepository;
import com.ems.service.Interface.OnboardingService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.security.Principal;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/onboarding")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class OnboardingController {

    private final OnboardingService onboardingService;
    private final UserRepository userRepository;

    private boolean isAuthorized(Long employeeId, Principal principal) {
        User user = userRepository.findByUsername(principal.getName())
                .orElseThrow(() -> new RuntimeException("User not found"));
        String role = user.getRole().getRoleName();
        if ("ADMIN".equals(role) || "HR".equals(role)) return true;
        return user.getEmployee() != null && user.getEmployee().getId().equals(employeeId);
    }

    // --- Education ---
    @PostMapping("/{employeeId}/education")
    @PreAuthorize("hasAnyAuthority('ADMIN', 'HR', 'EMPLOYEE')")
    public ResponseEntity<EducationDetail> saveEducation(@PathVariable Long employeeId, @RequestBody EducationDetail education) {
        return ResponseEntity.ok(onboardingService.saveEducation(employeeId, education));
    }

    @GetMapping("/{employeeId}/education")
    @PreAuthorize("hasAnyAuthority('ADMIN', 'HR', 'EMPLOYEE')")
    public ResponseEntity<List<EducationDetail>> getEducation(@PathVariable Long employeeId, Principal principal) {
        if (!isAuthorized(employeeId, principal)) return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        return ResponseEntity.ok(onboardingService.getEducationByEmployee(employeeId));
    }

    @DeleteMapping("/education/{id}")
    @PreAuthorize("hasAnyAuthority('ADMIN', 'HR', 'EMPLOYEE')")
    public ResponseEntity<Void> deleteEducation(@PathVariable Long id) {
        onboardingService.deleteEducation(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/education/{eduId}/document")
    @PreAuthorize("hasAnyAuthority('ADMIN', 'HR', 'EMPLOYEE')")
    public ResponseEntity<EducationDetail> uploadEducationDoc(
            @PathVariable Long eduId,
            @RequestParam("file") MultipartFile file) {
        return ResponseEntity.ok(onboardingService.saveEducationDoc(eduId, file));
    }

    // --- Employment History ---
    @PostMapping("/{employeeId}/employment")
    @PreAuthorize("hasAnyAuthority('ADMIN', 'HR', 'EMPLOYEE')")
    public ResponseEntity<EmploymentHistory> saveEmployment(@PathVariable Long employeeId, @RequestBody EmploymentHistory history) {
        return ResponseEntity.ok(onboardingService.saveEmploymentHistory(employeeId, history));
    }

    @GetMapping("/{employeeId}/employment")
    @PreAuthorize("hasAnyAuthority('ADMIN', 'HR', 'EMPLOYEE')")
    public ResponseEntity<List<EmploymentHistory>> getEmployment(@PathVariable Long employeeId, Principal principal) {
        if (!isAuthorized(employeeId, principal)) return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        return ResponseEntity.ok(onboardingService.getEmploymentHistoryByEmployee(employeeId));
    }

    @PostMapping("/{employeeId}/employment/batch")
    @PreAuthorize("hasAnyAuthority('ADMIN', 'HR', 'EMPLOYEE')")
    public ResponseEntity<List<EmploymentHistory>> saveEmploymentBatch(@PathVariable Long employeeId, @RequestBody List<EmploymentHistory> history) {
        return ResponseEntity.ok(onboardingService.saveEmploymentHistory(employeeId, history));
    }

    @DeleteMapping("/employment/{id}")
    @PreAuthorize("hasAnyAuthority('ADMIN', 'HR', 'EMPLOYEE')")
    public ResponseEntity<Void> deleteEmployment(@PathVariable Long id) {
        onboardingService.deleteEmploymentHistory(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/employment/{historyId}/documents")
    @PreAuthorize("hasAnyAuthority('ADMIN', 'HR', 'EMPLOYEE')")
    public ResponseEntity<EmploymentHistory> uploadEmploymentDoc(
            @PathVariable Long historyId,
            @RequestParam("file") MultipartFile file,
            @RequestParam("docType") String docType) {
        return ResponseEntity.ok(onboardingService.saveEmploymentHistoryDoc(historyId, docType, file));
    }

    // --- Documents ---
    @PostMapping("/{employeeId}/documents")
    @PreAuthorize("hasAnyAuthority('ADMIN', 'HR', 'EMPLOYEE')")
    public ResponseEntity<EmployeeDocument> uploadDocument(
            @PathVariable Long employeeId,
            @RequestParam("file") MultipartFile file,
            @RequestParam("documentType") String documentType,
            @RequestParam("category") String category) {
        return ResponseEntity.ok(onboardingService.saveDocument(employeeId, documentType, category, file));
    }

    @GetMapping("/{employeeId}/documents")
    @PreAuthorize("hasAnyAuthority('ADMIN', 'HR', 'EMPLOYEE')")
    public ResponseEntity<List<EmployeeDocument>> getDocuments(
            @PathVariable Long employeeId,
            @RequestParam(required = false) String category,
            Principal principal) {
        if (!isAuthorized(employeeId, principal)) return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        return ResponseEntity.ok(onboardingService.getDocumentsByEmployeeAndCategory(employeeId, category)); 
    }

    @DeleteMapping("/documents/{id}")
    @PreAuthorize("hasAnyAuthority('ADMIN', 'HR', 'EMPLOYEE')")
    public ResponseEntity<Void> deleteDocument(@PathVariable Long id) {
        onboardingService.deleteDocument(id);
        return ResponseEntity.noContent().build();
    }

    // --- Emergency Details ---
    @PutMapping("/{employeeId}/emergency")
    @PreAuthorize("hasAnyAuthority('ADMIN', 'HR', 'EMPLOYEE')")
    public ResponseEntity<Void> updateEmergency(
            @PathVariable Long employeeId,
            @RequestBody Map<String, String> details,
            Principal principal) {
        if (!isAuthorized(employeeId, principal)) return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        onboardingService.updateEmergencyDetails(
            employeeId,
            details.get("name"),
            details.get("relationship"),
            details.get("phone"),
            details.get("address")
        );
        return ResponseEntity.ok().build();
    }

    // --- Checklist ---
    @GetMapping("/{employeeId}/checklist")
    @PreAuthorize("hasAnyAuthority('ADMIN', 'HR', 'EMPLOYEE')")
    public ResponseEntity<OnboardingChecklist> getChecklist(@PathVariable Long employeeId, Principal principal) {
        if (!isAuthorized(employeeId, principal)) return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        return ResponseEntity.ok(onboardingService.getChecklist(employeeId));
    }

    @PostMapping("/{employeeId}/checklist")
    @PreAuthorize("hasAnyAuthority('ADMIN', 'HR')")
    public ResponseEntity<OnboardingChecklist> saveChecklist(@PathVariable Long employeeId, @RequestBody Map<String, Object> data) {
        return ResponseEntity.ok(onboardingService.saveChecklist(employeeId, data));
    }

    // --- Feedback ---
    @GetMapping("/{employeeId}/feedback")
    @PreAuthorize("hasAnyAuthority('ADMIN', 'HR', 'EMPLOYEE')")
    public ResponseEntity<InductionFeedback> getFeedback(@PathVariable Long employeeId, Principal principal) {
        if (!isAuthorized(employeeId, principal)) return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        return ResponseEntity.ok(onboardingService.getFeedback(employeeId));
    }

    @PostMapping("/{employeeId}/feedback")
    @PreAuthorize("hasAnyAuthority('ADMIN', 'HR', 'EMPLOYEE')")
    public ResponseEntity<InductionFeedback> saveFeedback(@PathVariable Long employeeId, @RequestBody Map<String, Object> data, Principal principal) {
        if (!isAuthorized(employeeId, principal)) return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        return ResponseEntity.ok(onboardingService.saveFeedback(employeeId, data));
    }

    // --- BGV ---
    @GetMapping("/{employeeId}/verification")
    @PreAuthorize("hasAnyAuthority('ADMIN', 'HR', 'EMPLOYEE')")
    public ResponseEntity<BackgroundVerification> getVerification(@PathVariable Long employeeId, Principal principal) {
        if (!isAuthorized(employeeId, principal)) return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        return ResponseEntity.ok(onboardingService.getVerification(employeeId));
    }

    @PostMapping("/{employeeId}/verification")
    @PreAuthorize("hasAnyAuthority('ADMIN', 'HR')")
    public ResponseEntity<BackgroundVerification> saveVerification(@PathVariable Long employeeId, @RequestBody Map<String, Object> data) {
        return ResponseEntity.ok(onboardingService.saveVerification(employeeId, data));
    }
}
