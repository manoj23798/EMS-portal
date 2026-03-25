package com.ems.service;

import com.ems.dto.request.InductionFeedbackRequest;
import com.ems.dto.response.InductionFeedbackResponse;
import com.ems.dto.response.OnboardingChecklistResponse;
import com.ems.dto.response.OnboardingDocumentResponse;
import com.ems.dto.response.OnboardingResponse;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

public interface OnboardingService {
    
    // Admin / HR Methods
    OnboardingResponse startOnboarding(Long employeeId);
    List<OnboardingResponse> getAllOnboardings();
    OnboardingDocumentResponse verifyDocument(Long documentId, Long hrId, String status);
    List<InductionFeedbackResponse> getAllFeedback();

    // Employee Methods
    OnboardingResponse getMyOnboarding(Long employeeId);
    
    OnboardingDocumentResponse uploadDocument(Long employeeId, String documentType, MultipartFile file);
    List<OnboardingDocumentResponse> getMyDocuments(Long employeeId);
    
    List<OnboardingChecklistResponse> getMyChecklist(Long employeeId);
    OnboardingChecklistResponse updateChecklistTask(Long taskId, Long employeeId, String status);
    
    InductionFeedbackResponse submitFeedback(InductionFeedbackRequest request);
    InductionFeedbackResponse getMyFeedback(Long employeeId);
}
