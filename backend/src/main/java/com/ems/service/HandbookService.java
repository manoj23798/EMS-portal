package com.ems.service;

import com.ems.dto.request.HandbookPolicyRequest;
import com.ems.dto.response.HandbookPolicyResponse;

import java.util.List;

public interface HandbookService {
    
    // Policy APIs
    HandbookPolicyResponse createPolicy(HandbookPolicyRequest request, Long hrEmployeeId);
    HandbookPolicyResponse updatePolicy(Long policyId, HandbookPolicyRequest request, Long hrEmployeeId);
    List<HandbookPolicyResponse> getAllPolicies();
    HandbookPolicyResponse getPolicyById(Long id);
    void archivePolicy(Long id);
}
