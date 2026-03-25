package com.ems.service;

import com.ems.dto.request.CommunicationCreateRequest;
import com.ems.dto.response.CommunicationResponse;
import com.ems.dto.response.CommunicationTypeResponse;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

public interface CommunicationService {
    List<CommunicationTypeResponse> getAllCommunicationTypes();
    
    CommunicationResponse createCommunication(CommunicationCreateRequest request, MultipartFile attachment);
    
    List<CommunicationResponse> getAllCommunicationsAdmin();
    
    CommunicationResponse getCommunicationByIdForAdmin(Long id);
    
    void deleteCommunication(Long id);
    
    List<CommunicationResponse> getMyCommunications(Long employeeId);
    
    CommunicationResponse getCommunicationByIdForEmployee(Long id, Long employeeId);
}
