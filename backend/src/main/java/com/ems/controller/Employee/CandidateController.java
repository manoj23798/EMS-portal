package com.ems.controller.Employee;

import com.ems.entity.Employee.Candidate;
import com.ems.entity.Employee.Employee;
import com.ems.repository.Employee.CandidateRepository;
import com.ems.repository.Employee.EmployeeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/candidates")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class CandidateController {

    private final CandidateRepository candidateRepository;
    private final EmployeeRepository employeeRepository;
    private final Path rootLocation = Paths.get("uploads");

    @GetMapping("/{employeeId}")
    public ResponseEntity<Candidate> getCandidateByEmployee(@PathVariable Long employeeId) {
        return candidateRepository.findByEmployeeId(employeeId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.noContent().build());
    }

    @PostMapping("/{employeeId}")
    public ResponseEntity<Candidate> saveCandidate(@PathVariable Long employeeId,
            @RequestBody Map<String, Object> payload) {
        Employee employee = employeeRepository.findById(employeeId)
                .orElseThrow(() -> new RuntimeException("Employee not found"));

        Candidate candidate = candidateRepository.findByEmployeeId(employeeId)
                .orElse(new Candidate());

        candidate.setEmployee(employee);

        // Map top level fields
        if (payload.get("applicationDate") != null && !payload.get("applicationDate").toString().isEmpty()) {
            candidate.setApplicationDate(java.time.LocalDate.parse(payload.get("applicationDate").toString()));
        }
        candidate.setMaritalStatus((String) payload.get("maritalStatus"));
        candidate.setAlternateNo((String) payload.get("alternateNo"));
        candidate.setCurrentCTC((String) payload.get("currentCTC"));
        candidate.setNoticePeriodMM((String) payload.get("noticePeriodMM"));
        candidate.setTotalExpYY((String) payload.get("totalExpYY"));
        candidate.setTotalExpMM((String) payload.get("totalExpMM"));
        candidate.setAppliedEarlier((String) payload.get("appliedEarlier"));
        candidate.setAppliedDetails((String) payload.get("appliedDetails"));
        candidate.setRelativeWorking((String) payload.get("relativeWorking"));
        candidate.setRelativeName((String) payload.get("relativeName"));
        candidate.setRelativeDept((String) payload.get("relativeDept"));
        candidate.setRelativeDivision((String) payload.get("relativeDivision"));
        candidate.setRelativeLocation((String) payload.get("relativeLocation"));
        candidate.setRelativeRelation((String) payload.get("relativeRelation"));
        candidate.setSource((String) payload.get("source"));
        if (payload.containsKey("skills")) {
            candidate.setSkills((String) payload.get("skills"));
        }
        candidate.setJobAppliedFor((String) payload.get("jobAppliedFor"));

        // Map JSON structures directly from payload
        candidate.setInterview((Map<String, Object>) payload.get("interview"));
        candidate.setWorkHistory((List<Map<String, Object>>) payload.get("workHistory"));
        candidate.setAcademic((List<Map<String, Object>>) payload.get("academic"));
        candidate.setBank((Map<String, String>) payload.get("bank"));

        return ResponseEntity.ok(candidateRepository.save(candidate));
    }

    @PostMapping("/{employeeId}/photo")
    public ResponseEntity<Candidate> uploadPhoto(
            @PathVariable Long employeeId,
            @RequestParam("file") MultipartFile file) {

        Candidate candidate = candidateRepository.findByEmployeeId(employeeId)
                .orElseGet(() -> {
                    Candidate newCand = new Candidate();
                    newCand.setEmployee(employeeRepository.findById(employeeId).orElseThrow());
                    return newCand;
                });

        try {
            String fileName = System.currentTimeMillis() + "_" + StringUtils.cleanPath(file.getOriginalFilename());
            if (!Files.exists(rootLocation))
                Files.createDirectories(rootLocation);
            try (InputStream inputStream = file.getInputStream()) {
                Files.copy(inputStream, rootLocation.resolve(fileName), StandardCopyOption.REPLACE_EXISTING);
            }
            String fileUrl = "/uploads/" + fileName;
            candidate.setCandidatePhotoUrl(fileUrl);
            return ResponseEntity.ok(candidateRepository.save(candidate));
        } catch (IOException e) {
            throw new RuntimeException("Upload failed", e);
        }
    }
}
