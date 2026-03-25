package com.ems.service.impl;

import com.ems.dto.request.InductionFeedbackRequest;
import com.ems.dto.response.InductionFeedbackResponse;
import com.ems.dto.response.OnboardingChecklistResponse;
import com.ems.dto.response.OnboardingDocumentResponse;
import com.ems.dto.response.OnboardingResponse;
import com.ems.entity.*;
import com.ems.exception.ResourceNotFoundException;
import com.ems.repository.*;
import com.ems.service.OnboardingService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Arrays;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class OnboardingServiceImpl implements OnboardingService {

    private final OnboardingRepository onboardingRepository;
    private final OnboardingDocumentRepository documentRepository;
    private final OnboardingChecklistRepository checklistRepository;
    private final InductionFeedbackRepository feedbackRepository;
    private final EmployeeRepository employeeRepository;

    @Value("${upload.dir:uploads}")
    private String uploadDir;

    @Override
    @Transactional
    public OnboardingResponse startOnboarding(Long employeeId) {
        Employee employee = employeeRepository.findById(employeeId)
                .orElseThrow(() -> new ResourceNotFoundException("Employee not found with id: " + employeeId));

        if (onboardingRepository.findByEmployeeId(employeeId).isPresent()) {
            throw new RuntimeException("Onboarding already initiated for this employee");
        }

        Onboarding onboarding = new Onboarding();
        onboarding.setEmployee(employee);
        onboarding.setStatus("In Progress");
        onboardingRepository.save(onboarding);

        // Generate default checklist
        List<String> defaultTasks = Arrays.asList(
                "Upload Aadhaar",
                "Upload PAN",
                "Sign NDA",
                "Sign NCA",
                "Submit emergency contact details",
                "Upload educational certificates",
                "Upload experience certificates"
        );

        for (String task : defaultTasks) {
            OnboardingChecklist item = new OnboardingChecklist();
            item.setEmployee(employee);
            item.setTaskName(task);
            checklistRepository.save(item);
        }

        return mapToResponse(onboarding);
    }

    @Override
    public List<OnboardingResponse> getAllOnboardings() {
        return onboardingRepository.findAll().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public OnboardingDocumentResponse verifyDocument(Long documentId, Long hrId, String status) {
        OnboardingDocument doc = documentRepository.findById(documentId)
                .orElseThrow(() -> new ResourceNotFoundException("Document not found"));
        Employee hr = employeeRepository.findById(hrId)
                .orElseThrow(() -> new ResourceNotFoundException("HR not found"));

        doc.setVerificationStatus(status);
        doc.setVerifiedBy(hr);
        return mapToDocResponse(documentRepository.save(doc));
    }

    @Override
    public List<InductionFeedbackResponse> getAllFeedback() {
        return feedbackRepository.findAll().stream()
                .map(this::mapToFeedbackResponse)
                .collect(Collectors.toList());
    }

    @Override
    public OnboardingResponse getMyOnboarding(Long employeeId) {
        Onboarding ob = onboardingRepository.findByEmployeeId(employeeId)
                .orElseThrow(() -> new ResourceNotFoundException("No onboarding found for employee"));
        return mapToResponse(ob);
    }

    @Override
    @Transactional
    public OnboardingDocumentResponse uploadDocument(Long employeeId, String documentType, MultipartFile file) {
        Employee employee = employeeRepository.findById(employeeId)
                .orElseThrow(() -> new ResourceNotFoundException("Employee not found"));

        if (file.getSize() > 5 * 1024 * 1024) { // 5MB
            throw new RuntimeException("File size exceeds 5MB limit");
        }

        try {
            Path dir = Paths.get(uploadDir);
            if (!Files.exists(dir)) {
                Files.createDirectories(dir);
            }

            String fileName = UUID.randomUUID().toString() + "_" + file.getOriginalFilename().replaceAll("[^a-zA-Z0-9.-]", "_");
            Path filePath = dir.resolve(fileName);
            Files.copy(file.getInputStream(), filePath);

            String fileUrl = "/uploads/" + fileName;

            OnboardingDocument doc = new OnboardingDocument();
            doc.setEmployee(employee);
            doc.setDocumentType(documentType);
            doc.setFileUrl(fileUrl);
            doc.setVerificationStatus("Pending");

            return mapToDocResponse(documentRepository.save(doc));
        } catch (IOException e) {
            throw new RuntimeException("Could not store the file. Error: " + e.getMessage());
        }
    }

    @Override
    public List<OnboardingDocumentResponse> getMyDocuments(Long employeeId) {
        return documentRepository.findByEmployeeId(employeeId).stream()
                .map(this::mapToDocResponse)
                .collect(Collectors.toList());
    }

    @Override
    public List<OnboardingChecklistResponse> getMyChecklist(Long employeeId) {
        return checklistRepository.findByEmployeeId(employeeId).stream()
                .map(this::mapToTaskResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public OnboardingChecklistResponse updateChecklistTask(Long taskId, Long employeeId, String status) {
        OnboardingChecklist task = checklistRepository.findById(taskId)
                .orElseThrow(() -> new ResourceNotFoundException("Task not found"));

        if (!task.getEmployee().getId().equals(employeeId)) {
            throw new RuntimeException("Not authorized to update this task");
        }

        task.setStatus(status);
        if ("Completed".equals(status)) {
            task.setCompletedAt(java.time.LocalDateTime.now());
        }

        OnboardingChecklist saved = checklistRepository.save(task);
        checkAndUpdateOverallOnboardingStatus(employeeId);
        
        return mapToTaskResponse(saved);
    }

    @Override
    @Transactional
    public InductionFeedbackResponse submitFeedback(InductionFeedbackRequest request) {
        Employee employee = employeeRepository.findById(request.getEmployeeId())
                .orElseThrow(() -> new ResourceNotFoundException("Employee not found"));

        if (feedbackRepository.findByEmployeeId(employee.getId()).isPresent()) {
            throw new RuntimeException("Feedback already submitted");
        }

        // Validate checklist is 100% complete
        List<OnboardingChecklist> tasks = checklistRepository.findByEmployeeId(employee.getId());
        boolean allComplete = !tasks.isEmpty() && tasks.stream().allMatch(t -> "Completed".equals(t.getStatus()));
        
        if (!allComplete) {
            throw new RuntimeException("Cannot submit feedback until all checklist tasks are Completed.");
        }

        InductionFeedback feedback = new InductionFeedback();
        feedback.setEmployee(employee);
        feedback.setRating(request.getRating());
        feedback.setFeedback(request.getFeedback());
        feedback.setSuggestions(request.getSuggestions());

        InductionFeedback saved = feedbackRepository.save(feedback);
        
        // Mark overall onboarding as Completed
        Onboarding ob = onboardingRepository.findByEmployeeId(employee.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Onboarding not found"));
        ob.setStatus("Completed");
        onboardingRepository.save(ob);

        return mapToFeedbackResponse(saved);
    }

    @Override
    public InductionFeedbackResponse getMyFeedback(Long employeeId) {
        InductionFeedback fb = feedbackRepository.findByEmployeeId(employeeId)
                .orElseThrow(() -> new ResourceNotFoundException("No feedback found"));
        return mapToFeedbackResponse(fb);
    }

    private void checkAndUpdateOverallOnboardingStatus(Long employeeId) {
        List<OnboardingChecklist> tasks = checklistRepository.findByEmployeeId(employeeId);
        boolean allComplete = !tasks.isEmpty() && tasks.stream().allMatch(t -> "Completed".equals(t.getStatus()));
        
        if (allComplete) {
            onboardingRepository.findByEmployeeId(employeeId).ifPresent(ob -> {
                if ("Pending".equals(ob.getStatus()) || "In Progress".equals(ob.getStatus())) {
                    // It becomes fully completed only after feedback, but we can keep it In Progress until feedback
                    // or maybe update to "Pending Feedback". Let's keep it "In Progress" until feedback is submitted.
                }
            });
        }
    }

    // Mappers
    private OnboardingResponse mapToResponse(Onboarding ob) {
        OnboardingResponse res = new OnboardingResponse();
        res.setId(ob.getId());
        res.setEmployeeId(ob.getEmployee().getId());
        res.setEmployeeName(ob.getEmployee().getFirstName() + " " + ob.getEmployee().getLastName());
        res.setDepartmentName(ob.getEmployee().getDepartment() != null ? ob.getEmployee().getDepartment().getName() : "N/A");
        res.setDesignationTitle(ob.getEmployee().getDesignation() != null ? ob.getEmployee().getDesignation().getTitle() : "N/A");
        res.setStatus(ob.getStatus());
        res.setCreatedAt(ob.getCreatedAt());
        res.setUpdatedAt(ob.getUpdatedAt());
        return res;
    }

    private OnboardingDocumentResponse mapToDocResponse(OnboardingDocument doc) {
        OnboardingDocumentResponse res = new OnboardingDocumentResponse();
        res.setId(doc.getId());
        res.setDocumentType(doc.getDocumentType());
        res.setFileUrl(doc.getFileUrl());
        res.setVerificationStatus(doc.getVerificationStatus());
        if (doc.getVerifiedBy() != null) {
            res.setVerifiedByName(doc.getVerifiedBy().getFirstName() + " " + doc.getVerifiedBy().getLastName());
        }
        res.setUploadedAt(doc.getUploadedAt());
        return res;
    }

    private OnboardingChecklistResponse mapToTaskResponse(OnboardingChecklist task) {
        OnboardingChecklistResponse res = new OnboardingChecklistResponse();
        res.setId(task.getId());
        res.setTaskName(task.getTaskName());
        res.setStatus(task.getStatus());
        res.setCompletedAt(task.getCompletedAt());
        return res;
    }

    private InductionFeedbackResponse mapToFeedbackResponse(InductionFeedback fb) {
        InductionFeedbackResponse res = new InductionFeedbackResponse();
        res.setId(fb.getId());
        res.setEmployeeId(fb.getEmployee().getId());
        res.setEmployeeName(fb.getEmployee().getFirstName() + " " + fb.getEmployee().getLastName());
        res.setRating(fb.getRating());
        res.setFeedback(fb.getFeedback());
        res.setSuggestions(fb.getSuggestions());
        res.setSubmittedAt(fb.getSubmittedAt());
        return res;
    }
}
