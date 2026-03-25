package com.ems.service.impl;

import com.ems.dto.request.CommunicationCreateRequest;
import com.ems.dto.response.CommunicationResponse;
import com.ems.dto.response.CommunicationTypeResponse;
import com.ems.entity.*;
import com.ems.exception.ResourceNotFoundException;
import com.ems.repository.*;
import com.ems.service.CommunicationService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CommunicationServiceImpl implements CommunicationService {

    private final CommunicationRepository communicationRepository;
    private final CommunicationTypeRepository communicationTypeRepository;
    private final CommunicationTargetRepository targetRepository;
    private final EmployeeRepository employeeRepository;
    private final DepartmentRepository departmentRepository;
    private final UserRepository userRepository;

    @Value("${upload.dir:uploads}")
    private String uploadDir;

    @Override
    public List<CommunicationTypeResponse> getAllCommunicationTypes() {
        return communicationTypeRepository.findAll().stream()
                .map(this::mapToTypeResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public CommunicationResponse createCommunication(CommunicationCreateRequest request, MultipartFile attachment) {
        Employee createdBy = employeeRepository.findById(request.getCreatedById())
                .orElseThrow(() -> new ResourceNotFoundException("HR Employee not found"));

        CommunicationType type = communicationTypeRepository.findById(request.getCommunicationTypeId())
                .orElseThrow(() -> new ResourceNotFoundException("Communication Type not found"));

        Communication communication = new Communication();
        communication.setCommunicationType(type);
        communication.setTitle(request.getTitle());
        communication.setSubject(request.getSubject());
        communication.setDescription(request.getDescription());
        communication.setIssueDate(request.getIssueDate());
        communication.setTargetType(request.getTargetType());
        communication.setCreatedBy(createdBy);

        if (attachment != null && !attachment.isEmpty()) {
            if (attachment.getSize() > 5 * 1024 * 1024) {
                throw new RuntimeException("File size exceeds 5MB limit");
            }
            try {
                Path dir = Paths.get(uploadDir);
                if (!Files.exists(dir)) Files.createDirectories(dir);

                String fileName = UUID.randomUUID().toString() + "_" + attachment.getOriginalFilename().replaceAll("[^a-zA-Z0-9.-]", "_");
                Path filePath = dir.resolve(fileName);
                Files.copy(attachment.getInputStream(), filePath);
                communication.setAttachmentUrl("/uploads/" + fileName);
            } catch (IOException e) {
                throw new RuntimeException("Could not store the attachment. Error: " + e.getMessage());
            }
        }

        Communication savedCommunication = communicationRepository.save(communication);

        // Process Targets
        if ("Single".equalsIgnoreCase(request.getTargetType())) {
            Employee targetEmp = employeeRepository.findById(request.getTargetEmployeeId())
                    .orElseThrow(() -> new ResourceNotFoundException("Target Employee not found"));
            CommunicationTarget target = new CommunicationTarget();
            target.setCommunication(savedCommunication);
            target.setEmployee(targetEmp);
            targetRepository.save(target);
        } else if ("Group".equalsIgnoreCase(request.getTargetType())) {
            CommunicationTarget target = new CommunicationTarget();
            target.setCommunication(savedCommunication);
            if (request.getTargetDepartmentId() != null) {
                Department dept = departmentRepository.findById(request.getTargetDepartmentId())
                        .orElseThrow(() -> new ResourceNotFoundException("Target Department not found"));
                target.setDepartment(dept);
            }
            if (request.getTargetRole() != null && !request.getTargetRole().isEmpty()) {
                target.setRole(CommunicationTarget.EmployeeRole.valueOf(request.getTargetRole().toUpperCase()));
            }
            targetRepository.save(target);
        } else if ("All".equalsIgnoreCase(request.getTargetType())) {
            // Can be represented by an empty target or a special flag.
            // A target with all nulls linked to the communication implies ALL.
            CommunicationTarget target = new CommunicationTarget();
            target.setCommunication(savedCommunication);
            targetRepository.save(target);
        }

        return mapToResponse(savedCommunication);
    }

    @Override
    public List<CommunicationResponse> getAllCommunicationsAdmin() {
        return communicationRepository.findAll().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    public CommunicationResponse getCommunicationByIdForAdmin(Long id) {
        Communication com = communicationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Communication not found"));
        return mapToResponse(com);
    }

    @Override
    @Transactional
    public void deleteCommunication(Long id) {
        targetRepository.deleteByCommunicationId(id);
        communicationRepository.deleteById(id);
    }

    @Override
    public List<CommunicationResponse> getMyCommunications(Long employeeId) {
        Employee employee = employeeRepository.findById(employeeId)
                .orElseThrow(() -> new ResourceNotFoundException("Employee not found"));

        List<CommunicationResponse> myComms = new ArrayList<>();
        List<Communication> allComms = communicationRepository.findAll();

        for (Communication com : allComms) {
            List<CommunicationTarget> targets = targetRepository.findByCommunicationId(com.getId());
            boolean hasAccess = false;
            
            for(CommunicationTarget target : targets) {
                if (target.getEmployee() == null && target.getDepartment() == null && target.getRole() == null) {
                    hasAccess = true; // "ALL" target
                    break;
                }
                if (target.getEmployee() != null && target.getEmployee().getId().equals(employeeId)) {
                    hasAccess = true;
                    break;
                }
                if (target.getDepartment() != null && employee.getDepartment() != null &&
                    target.getDepartment().getId().equals(employee.getDepartment().getId())) {
                    
                    // Further check if Role matches (if specified)
                    if (target.getRole() != null) {
                        String empRole = userRepository.findByEmployeeId(employeeId).map(u -> u.getRole().getRoleName()).orElse("");
                        if (!empRole.isEmpty() && target.getRole().name().equals(empRole)) {
                            hasAccess = true;
                        }
                    } else {
                        hasAccess = true;
                    }
                    if (hasAccess) break;
                }
                if (target.getDepartment() == null && target.getRole() != null) {
                    String empRole = userRepository.findByEmployeeId(employeeId).map(u -> u.getRole().getRoleName()).orElse("");
                    if (!empRole.isEmpty() && target.getRole().name().equals(empRole)) {
                        hasAccess = true;
                        break;
                    }
                }
            }
            
            if (hasAccess) {
                myComms.add(mapToResponse(com));
            }
        }

        return myComms;
    }

    @Override
    public CommunicationResponse getCommunicationByIdForEmployee(Long id, Long employeeId) {
        List<CommunicationResponse> myComms = getMyCommunications(employeeId);
        return myComms.stream()
                .filter(c -> c.getId().equals(id))
                .findFirst()
                .orElseThrow(() -> new ResourceNotFoundException("Communication not found or access denied"));
    }

    private CommunicationTypeResponse mapToTypeResponse(CommunicationType type) {
        CommunicationTypeResponse res = new CommunicationTypeResponse();
        res.setId(type.getId());
        res.setTypeName(type.getTypeName());
        res.setDescription(type.getDescription());
        return res;
    }

    private CommunicationResponse mapToResponse(Communication com) {
        CommunicationResponse res = new CommunicationResponse();
        res.setId(com.getId());
        if (com.getCommunicationType() != null) {
            res.setCommunicationTypeId(com.getCommunicationType().getId());
            res.setCommunicationTypeName(com.getCommunicationType().getTypeName());
        }
        res.setTitle(com.getTitle());
        res.setSubject(com.getSubject());
        res.setDescription(com.getDescription());
        res.setAttachmentUrl(com.getAttachmentUrl());
        res.setIssueDate(com.getIssueDate());
        res.setTargetType(com.getTargetType());
        if (com.getCreatedBy() != null) {
            res.setCreatedById(com.getCreatedBy().getId());
            res.setCreatedByName(com.getCreatedBy().getFirstName() + " " + com.getCreatedBy().getLastName());
        }
        res.setCreatedAt(com.getCreatedAt());

        // Derive status mock logic based on issueDate vs now
        if (java.time.LocalDate.now().isBefore(com.getIssueDate())) {
            res.setStatus("Scheduled");
        } else {
            res.setStatus("Published");
        }

        // Include target details for Admin
        List<CommunicationTarget> targets = targetRepository.findByCommunicationId(com.getId());
        if (!targets.isEmpty()) {
            CommunicationTarget target = targets.get(0); // usually just one record per com if grouped
            if (target.getEmployee() != null) {
                res.setTargetEmployeeId(target.getEmployee().getId());
                res.setTargetEmployeeName(target.getEmployee().getFirstName() + " " + target.getEmployee().getLastName());
            }
            if (target.getDepartment() != null) {
                res.setTargetDepartmentId(target.getDepartment().getId());
                res.setTargetDepartmentName(target.getDepartment().getName());
            }
            if (target.getRole() != null) {
                res.setTargetRole(target.getRole().name());
            }
        }

        return res;
    }
}
