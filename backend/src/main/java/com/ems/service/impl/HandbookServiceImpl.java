package com.ems.service.impl;

import com.ems.dto.request.HandbookPolicyRequest;
import com.ems.dto.response.HandbookPolicyResponse;
import com.ems.dto.response.HandbookVersionResponse;
import com.ems.entity.Employee;
import com.ems.entity.HandbookPolicy;
import com.ems.entity.HandbookVersion;
import com.ems.exception.ResourceNotFoundException;
import com.ems.repository.EmployeeRepository;
import com.ems.repository.HandbookPolicyRepository;
import com.ems.repository.HandbookVersionRepository;
import com.ems.service.HandbookService;
import com.ems.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class HandbookServiceImpl implements HandbookService {

    private final HandbookPolicyRepository policyRepository;
    private final HandbookVersionRepository versionRepository;
    private final EmployeeRepository employeeRepository;
    private final NotificationService notificationService;

    @Value("${upload.dir:uploads}")
    private String uploadDir;



    @Override
    @Transactional
    public HandbookPolicyResponse createPolicy(HandbookPolicyRequest request, Long hrEmployeeId) {
        Employee hr = employeeRepository.findById(hrEmployeeId)
                .orElseThrow(() -> new ResourceNotFoundException("HR Employee not found"));

        String initialVersion = (request.getVersion() != null && !request.getVersion().isEmpty()) ? request.getVersion() : "1.0";

        HandbookPolicy policy = HandbookPolicy.builder()
                .title(request.getTitle())
                .description(request.getDescription())
                .content(request.getContent())
                .documentUrl("N/A") // Fill empty string to bypass existing DB NOT-NULL constraint
                .version(initialVersion)
                .status("ACTIVE")
                .createdBy(hr)
                .build();

        HandbookPolicy savedPolicy = policyRepository.save(policy);
        
        // Save initial version to history table too
        saveVersionHistory(savedPolicy, initialVersion, request.getContent(), hr);
        
        // Trigger notification
        notificationService.createGlobalNotification("New Employee Handbook policy created: " + savedPolicy.getTitle() + " (v" + savedPolicy.getVersion() + ")");

        return mapPolicyToResponse(savedPolicy);
    }

    @Override
    @Transactional
    public HandbookPolicyResponse updatePolicy(Long policyId, HandbookPolicyRequest request, Long hrEmployeeId) {
        HandbookPolicy policy = policyRepository.findById(policyId)
                .orElseThrow(() -> new ResourceNotFoundException("Policy not found"));
                
        Employee hr = employeeRepository.findById(hrEmployeeId)
                .orElseThrow(() -> new ResourceNotFoundException("HR Employee not found"));

        if (request.getTitle() != null) {
            policy.setTitle(request.getTitle());
        }
        if (request.getDescription() != null) {
            policy.setDescription(request.getDescription());
        }

        boolean contentUpdated = false;
        String newVersion = policy.getVersion();

        if (request.getContent() != null && !request.getContent().equals(policy.getContent())) {
            policy.setContent(request.getContent());
            
            // Auto increment version x.y -> x.(y+1)
            newVersion = incrementVersion(policy.getVersion());
            
            if (request.getVersion() != null && !request.getVersion().isEmpty()) {
                newVersion = request.getVersion(); // Allow manual override
            }
            
            policy.setVersion(newVersion);
            contentUpdated = true;
        }

        HandbookPolicy savedPolicy = policyRepository.save(policy);

        if (contentUpdated) {
             saveVersionHistory(savedPolicy, newVersion, request.getContent(), hr);
             // Trigger notification
             notificationService.createGlobalNotification("Employee Handbook updated: " + savedPolicy.getTitle() + " (v" + savedPolicy.getVersion() + ")");
        }

        return mapPolicyToResponse(savedPolicy);
    }

    @Override
    public List<HandbookPolicyResponse> getAllPolicies() {
        return policyRepository.findAll().stream()
                .filter(p -> "ACTIVE".equals(p.getStatus()))
                .map(this::mapPolicyToResponse)
                .collect(Collectors.toList());
    }

    @Override
    public HandbookPolicyResponse getPolicyById(Long id) {
        HandbookPolicy policy = policyRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Policy not found"));
        return mapPolicyToResponse(policy);
    }

    @Override
    @Transactional
    public void archivePolicy(Long id) {
        HandbookPolicy policy = policyRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Policy not found"));
        policy.setStatus("ARCHIVED");
        policyRepository.save(policy);
    }
    
    // ----------- Helpers ----------- //

    private void validateFile(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new RuntimeException("File is empty or missing");
        }
        
        if (file.getSize() > 10 * 1024 * 1024) { // 10MB limit
            throw new RuntimeException("File size exceeds 10MB limit");
        }
        
        String contentType = file.getContentType();
        String originalName = file.getOriginalFilename();
        if (contentType == null || originalName == null) {
            throw new RuntimeException("Invalid file format");
        }
        
        boolean isPdf = contentType.equalsIgnoreCase("application/pdf") || originalName.toLowerCase().endsWith(".pdf");
        boolean isDocx = contentType.equalsIgnoreCase("application/vnd.openxmlformats-officedocument.wordprocessingml.document") 
                         || originalName.toLowerCase().endsWith(".docx");
                         
        if (!isPdf && !isDocx) {
            throw new RuntimeException("Only PDF and DOCX formats are strictly allowed");
        }
    }

    private String saveFile(MultipartFile file) {
        try {
            Path dir = Paths.get(uploadDir);
            if (!Files.exists(dir)) {
                Files.createDirectories(dir);
            }

            String originalName = file.getOriginalFilename();
            String safeName = UUID.randomUUID().toString() + "_" + (originalName != null ? originalName.replaceAll("[^a-zA-Z0-9.-]", "_") : "policy_doc");
            Path filePath = dir.resolve(safeName);
            Files.copy(file.getInputStream(), filePath);
            
            return "/uploads/" + safeName;
        } catch (IOException e) {
            throw new RuntimeException("Error saving document: " + e.getMessage());
        }
    }
    
    private void saveVersionHistory(HandbookPolicy policy, String version, String content, Employee hr) {
        HandbookVersion hv = HandbookVersion.builder()
                .policy(policy)
                .version(version)
                .content(content)
                .documentUrl("N/A") // Fill empty string to bypass existing DB NOT-NULL constraint
                .updatedBy(hr)
                .build();
        versionRepository.save(hv);
    }
    
    private String incrementVersion(String currentVersion) {
        try {
            // E.g. "1.0" -> "1.1"
            String[] parts = currentVersion.split("\\.");
            if (parts.length == 2) {
                int minor = Integer.parseInt(parts[1]);
                return parts[0] + "." + (minor + 1);
            }
        } catch (Exception e) {
            // Unparseable, just append ".1" safely
        }
        return currentVersion + ".1";
    }



    private HandbookPolicyResponse mapPolicyToResponse(HandbookPolicy p) {
        HandbookPolicyResponse r = new HandbookPolicyResponse();
        r.setId(p.getId());
        r.setTitle(p.getTitle());
        r.setDescription(p.getDescription());
        r.setContent(p.getContent());
        r.setDocumentUrl(p.getDocumentUrl());
        r.setVersion(p.getVersion());
        r.setStatus(p.getStatus());
        r.setCreatedAt(p.getCreatedAt());
        r.setUpdatedAt(p.getUpdatedAt());
        
        if (p.getCreatedBy() != null) {
            r.setCreatedById(p.getCreatedBy().getId());
            r.setCreatedByName(p.getCreatedBy().getFirstName() + " " + p.getCreatedBy().getLastName());
        }
        
        List<HandbookVersion> history = versionRepository.findByPolicyIdOrderByUpdatedAtDesc(p.getId());
        List<HandbookVersionResponse> hvrList = history.stream().map(this::mapVersionToResponse).collect(Collectors.toList());
        r.setVersionHistory(hvrList);
        
        return r;
    }
    
    private HandbookVersionResponse mapVersionToResponse(HandbookVersion v) {
        HandbookVersionResponse r = new HandbookVersionResponse();
        r.setId(v.getId());
        r.setVersion(v.getVersion());
        r.setContent(v.getContent());
        r.setDocumentUrl(v.getDocumentUrl());
        r.setUpdatedAt(v.getUpdatedAt());
        if (v.getUpdatedBy() != null) {
            r.setUpdatedById(v.getUpdatedBy().getId());
            r.setUpdatedByName(v.getUpdatedBy().getFirstName() + " " + v.getUpdatedBy().getLastName());
        }
        return r;
    }
}
