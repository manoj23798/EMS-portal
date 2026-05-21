package com.ems.service.Interface;

import com.ems.entity.Employee.EducationDetail;
import com.ems.entity.Employee.EmployeeDocument;
import com.ems.entity.Employee.EmploymentHistory;
import com.ems.entity.Employee.OnboardingChecklist;
import com.ems.entity.Employee.InductionFeedback;
import com.ems.entity.Employee.BackgroundVerification;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;

public interface OnboardingService {
    // Education
    EducationDetail saveEducation(Long employeeId, EducationDetail education);
    List<EducationDetail> getEducationByEmployee(Long employeeId);
    void deleteEducation(Long id);
    EducationDetail saveEducationDoc(Long eduId, MultipartFile file);

    // Employment History
    List<EmploymentHistory> saveEmploymentHistory(Long employeeId, List<EmploymentHistory> history);
    EmploymentHistory saveEmploymentHistory(Long employeeId, EmploymentHistory history);
    List<EmploymentHistory> getEmploymentHistoryByEmployee(Long employeeId);
    void deleteEmploymentHistory(Long id);
    EmploymentHistory saveEmploymentHistoryDoc(Long historyId, String docType, MultipartFile file);

    // Documents
    EmployeeDocument saveDocument(Long employeeId, String documentType, String category, MultipartFile file);
    List<EmployeeDocument> getDocumentsByEmployeeAndCategory(Long employeeId, String category);
    void deleteDocument(Long id);
    
    // Emergency Details
    void updateEmergencyDetails(Long employeeId, String name, String relationship, String phone, String address);

    // Checklist
    OnboardingChecklist getChecklist(Long employeeId);
    OnboardingChecklist saveChecklist(Long employeeId, Map<String, Object> data);

    // Feedback
    InductionFeedback getFeedback(Long employeeId);
    InductionFeedback saveFeedback(Long employeeId, Map<String, Object> data);

    // BGV
    BackgroundVerification getVerification(Long employeeId);
    BackgroundVerification saveVerification(Long employeeId, Map<String, Object> data);
}
