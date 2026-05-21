package com.ems.service.implementation;

import com.ems.entity.Employee.*;
import com.ems.repository.Employee.*;
import com.ems.service.Interface.OnboardingService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class OnboardingServiceImpl implements OnboardingService {

    private final EmployeeRepository employeeRepository;
    private final EmployeeDocumentRepository documentRepository;
    private final EducationDetailRepository educationRepository;
    private final EmploymentHistoryRepository employmentRepository;
    private final OnboardingChecklistRepository checklistRepository;
    private final InductionFeedbackRepository feedbackRepository;
    private final BackgroundVerificationRepository verificationRepository;

    private final Path rootLocation = Paths.get("uploads");

    @Override
    public EducationDetail saveEducation(Long employeeId, EducationDetail education) {
        Employee employee = employeeRepository.findById(employeeId)
                .orElseThrow(() -> new RuntimeException("Employee not found"));
        education.setEmployee(employee);
        return educationRepository.save(education);
    }

    @Override
    public EducationDetail saveEducationDoc(Long eduId, MultipartFile file) {
        EducationDetail education = educationRepository.findById(eduId)
                .orElseThrow(() -> new RuntimeException("Education entry not found"));

        try {
            String fileName = System.currentTimeMillis() + "_" + StringUtils.cleanPath(file.getOriginalFilename());
            if (!Files.exists(rootLocation))
                Files.createDirectories(rootLocation);
            try (InputStream inputStream = file.getInputStream()) {
                Files.copy(inputStream, rootLocation.resolve(fileName), StandardCopyOption.REPLACE_EXISTING);
            }
            String fileUrl = "/uploads/" + fileName;
            education.setDocumentUrl(fileUrl);
            return educationRepository.save(education);
        } catch (IOException e) {
            throw new RuntimeException("Upload failed", e);
        }
    }

    @Override
    public List<EducationDetail> getEducationByEmployee(Long employeeId) {
        return educationRepository.findByEmployeeId(employeeId);
    }

    @Override
    public void deleteEducation(Long id) {
        educationRepository.deleteById(id);
    }

    @Override
    public List<EmploymentHistory> saveEmploymentHistory(Long employeeId, List<EmploymentHistory> history) {
        Employee employee = employeeRepository.findById(employeeId)
                .orElseThrow(() -> new RuntimeException("Employee not found"));

        // Remove old entries to avoid duplicates/mess
        List<EmploymentHistory> existing = employmentRepository.findByEmployeeId(employeeId);
        employmentRepository.deleteAll(existing);

        for (EmploymentHistory h : history) {
            h.setEmployee(employee);
            h.setId(null); // Force new entry
        }
        return employmentRepository.saveAll(history);
    }

    @Override
    public EmploymentHistory saveEmploymentHistory(Long employeeId, EmploymentHistory history) {
        Employee employee = employeeRepository.findById(employeeId)
                .orElseThrow(() -> new RuntimeException("Employee not found"));
        history.setEmployee(employee);
        return employmentRepository.save(history);
    }

    @Override
    public List<EmploymentHistory> getEmploymentHistoryByEmployee(Long employeeId) {
        return employmentRepository.findByEmployeeId(employeeId);
    }

    @Override
    public void deleteEmploymentHistory(Long id) {
        employmentRepository.deleteById(id);
    }

    @Override
    public EmployeeDocument saveDocument(Long employeeId, String documentType, String category, MultipartFile file) {
        Employee employee = employeeRepository.findById(employeeId)
                .orElseThrow(() -> new RuntimeException("Employee not found"));

        try {
            String fileName = StringUtils.cleanPath(file.getOriginalFilename());
            fileName = System.currentTimeMillis() + "_" + fileName;

            if (!Files.exists(rootLocation)) {
                Files.createDirectories(rootLocation);
            }

            try (InputStream inputStream = file.getInputStream()) {
                Files.copy(inputStream, rootLocation.resolve(fileName), StandardCopyOption.REPLACE_EXISTING);
            }

            String fileUrl = "/uploads/" + fileName;

            EmployeeDocument document = new EmployeeDocument();
            document.setEmployee(employee);
            document.setDocumentType(documentType);
            document.setCategory(category);
            document.setDocumentUrl(fileUrl);

            return documentRepository.save(document);

        } catch (IOException e) {
            throw new RuntimeException("Could not store file", e);
        }
    }

    @Override
    public List<EmployeeDocument> getDocumentsByEmployeeAndCategory(Long employeeId, String category) {
        if (category == null || category.trim().isEmpty()) {
            return documentRepository.findByEmployeeId(employeeId);
        }
        return documentRepository.findByEmployeeIdAndCategory(employeeId, category);
    }

    @Override
    public void deleteDocument(Long id) {
        documentRepository.deleteById(id);
    }

    @Override
    public void updateEmergencyDetails(Long employeeId, String name, String relationship, String phone,
            String address) {
        Employee employee = employeeRepository.findById(employeeId)
                .orElseThrow(() -> new RuntimeException("Employee not found"));

        employee.setEmergencyContactName(name);
        employee.setEmergencyContactRelationship(relationship);
        employee.setEmergencyContactPhone(phone);
        employee.setEmergencyContactAddress(address);

        employeeRepository.save(employee);
    }

    @Override
    public EmploymentHistory saveEmploymentHistoryDoc(Long historyId, String docType, MultipartFile file) {
        EmploymentHistory history = employmentRepository.findById(historyId)
                .orElseThrow(() -> new RuntimeException("History entry not found"));

        try {
            String fileName = System.currentTimeMillis() + "_" + StringUtils.cleanPath(file.getOriginalFilename());
            if (!Files.exists(rootLocation))
                Files.createDirectories(rootLocation);
            try (InputStream inputStream = file.getInputStream()) {
                Files.copy(inputStream, rootLocation.resolve(fileName), StandardCopyOption.REPLACE_EXISTING);
            }
            String fileUrl = "/uploads/" + fileName;

            String docTypeLower = docType.toLowerCase();
            if (docTypeLower.contains("offer")) {
                history.setOfferLetterUrl(fileUrl);
            } else if (docTypeLower.contains("relieving")) {
                history.setRelievingLetterUrl(fileUrl);
            } else if (docTypeLower.contains("experience")) {
                history.setExperienceLetterUrl(fileUrl);
            } else if (docTypeLower.contains("pay") || docTypeLower.contains("slip")) {
                history.setPayslipsUrl(fileUrl);
            } else if (docTypeLower.contains("hike")) {
                history.setHikeLettersUrl(fileUrl);
            } else if (docTypeLower.contains("form")) {
                history.setForm16Url(fileUrl);
            } else if (docTypeLower.contains("bank") || docTypeLower.contains("statement")) {
                history.setBankStatementUrl(fileUrl);
            }
            return employmentRepository.save(history);
        } catch (IOException e) {
            throw new RuntimeException("Upload failed", e);
        }
    }

    @Override
    public OnboardingChecklist getChecklist(Long employeeId) {
        return checklistRepository.findByEmployeeId(employeeId).orElse(null);
    }

    @Override
    public OnboardingChecklist saveChecklist(Long employeeId, Map<String, Object> data) {
        Employee employee = employeeRepository.findById(employeeId)
                .orElseThrow(() -> new RuntimeException("Employee not found"));
        OnboardingChecklist checklist = checklistRepository.findByEmployeeId(employeeId)
                .orElse(new OnboardingChecklist());
        checklist.setEmployee(employee);
        checklist.setChecklistData(data);
        return checklistRepository.save(checklist);
    }

    @Override
    public InductionFeedback getFeedback(Long employeeId) {
        return feedbackRepository.findByEmployeeId(employeeId).orElse(null);
    }

    @Override
    public InductionFeedback saveFeedback(Long employeeId, Map<String, Object> data) {
        Employee employee = employeeRepository.findById(employeeId)
                .orElseThrow(() -> new RuntimeException("Employee not found"));
        InductionFeedback feedback = feedbackRepository.findByEmployeeId(employeeId)
                .orElse(new InductionFeedback());
        feedback.setEmployee(employee);
        feedback.setFeedbackData(data);
        return feedbackRepository.save(feedback);
    }

    @Override
    public BackgroundVerification getVerification(Long employeeId) {
        return verificationRepository.findByEmployeeId(employeeId).orElse(null);
    }

    @Override
    public BackgroundVerification saveVerification(Long employeeId, Map<String, Object> data) {
        Employee employee = employeeRepository.findById(employeeId)
                .orElseThrow(() -> new RuntimeException("Employee not found"));
        BackgroundVerification verification = verificationRepository.findByEmployeeId(employeeId)
                .orElse(new BackgroundVerification());
        verification.setEmployee(employee);
        verification.setVerificationData(data);
        return verificationRepository.save(verification);
    }
}
