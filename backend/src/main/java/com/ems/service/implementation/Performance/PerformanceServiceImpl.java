package com.ems.service.implementation.Performance;

import com.ems.entity.Performance.MonthlyPerformanceReview;
import com.ems.entity.Performance.PerformanceTemplate;
import com.ems.entity.Performance.ServiceRegister;
import com.ems.repository.Performance.MonthlyPerformanceReviewRepository;
import com.ems.repository.Performance.PerformanceTemplateRepository;
import com.ems.repository.Performance.ServiceRegisterRepository;
import com.ems.repository.Employee.EmployeeRepository;
import com.ems.service.Interface.Performance.PerformanceService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class PerformanceServiceImpl implements PerformanceService {

    private final PerformanceTemplateRepository templateRepository;
    private final MonthlyPerformanceReviewRepository mprRepository;
    private final ServiceRegisterRepository serviceRegisterRepository;
    private final EmployeeRepository employeeRepository;

    @Override
    public PerformanceTemplate createTemplate(PerformanceTemplate template) {
        return templateRepository.save(template);
    }

    @Override
    public PerformanceTemplate updateTemplate(Long id, PerformanceTemplate template) {
        PerformanceTemplate existing = getTemplateById(id);
        existing.setName(template.getName());
        existing.setTemplateData(template.getTemplateData());
        return templateRepository.save(existing);
    }

    @Override
    public List<PerformanceTemplate> getAllTemplates() {
        return templateRepository.findAll();
    }

    @Override
    public PerformanceTemplate getTemplateById(Long id) {
        return templateRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Template not found"));
    }

    @Override
    public void deleteTemplate(Long id) {
        templateRepository.deleteById(id);
    }

    @Override
    public MonthlyPerformanceReview createMPR(MonthlyPerformanceReview mpr) {
        return mprRepository.save(mpr);
    }

    @Override
    public MonthlyPerformanceReview updateMPR(Long id, MonthlyPerformanceReview mpr) {
        MonthlyPerformanceReview existing = getMPRById(id);
        existing.setEmployeeName(mpr.getEmployeeName());
        existing.setEmployeeRole(mpr.getEmployeeRole());
        existing.setEmployeeDepartment(mpr.getEmployeeDepartment());
        existing.setTotalScore(mpr.getTotalScore());
        existing.setReviewData(mpr.getReviewData());
        existing.setStatus(mpr.getStatus());
        return mprRepository.save(existing);
    }

    @Override
    public List<MonthlyPerformanceReview> getAllMPRs() {
        return mprRepository.findAll();
    }

    @Override
    public List<MonthlyPerformanceReview> getMPRsByEmployee(Long employeeId) {
        return mprRepository.findByEmployeeId(employeeId);
    }

    @Override
    public List<MonthlyPerformanceReview> getMPRsByManager(Long managerId) {
        return mprRepository.findByManagerId(managerId);
    }

    @Override
    public List<MonthlyPerformanceReview> getMPRsByEmployeeAndYear(Long employeeId, Integer year) {
        return mprRepository.findByEmployeeIdAndYear(employeeId, year);
    }

    @Override
    public MonthlyPerformanceReview getMPRById(Long id) {
        return mprRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("MPR not found"));
    }

    @Override
    public Map<String, Object> getDashboardStats() {
        Map<String, Object> stats = new HashMap<>();
        long totalEmployees = employeeRepository.count();
        List<MonthlyPerformanceReview> allReviews = mprRepository.findAll();
        long completedReviews = allReviews.stream().filter(r -> "SUBMITTED".equals(r.getStatus())).count();
        long pendingReviews = allReviews.stream().filter(r -> "DRAFT".equals(r.getStatus())).count();
        
        double avgScore = allReviews.stream()
                .filter(r -> "SUBMITTED".equals(r.getStatus()) && r.getTotalScore() != null)
                .mapToDouble(MonthlyPerformanceReview::getTotalScore)
                .average()
                .orElse(0.0);

        stats.put("totalEmployees", totalEmployees);
        stats.put("completedReviews", completedReviews);
        stats.put("pendingReviews", pendingReviews);
        stats.put("averageScore", avgScore);

        return stats;
    }

    @Override
    public ServiceRegister createServiceRegister(ServiceRegister entry) {
        return serviceRegisterRepository.save(entry);
    }

    @Override
    public ServiceRegister updateServiceRegister(Long id, ServiceRegister entry) {
        ServiceRegister existing = serviceRegisterRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Service Register entry not found"));
        existing.setDate(entry.getDate());
        existing.setNatureOfAction(entry.getNatureOfAction());
        existing.setDescription(entry.getDescription());
        existing.setCategory(entry.getCategory());
        existing.setReportedBy(entry.getReportedBy());
        existing.setRemarks(entry.getRemarks());
        return serviceRegisterRepository.save(existing);
    }

    @Override
    public List<ServiceRegister> getAllServiceRegisters() {
        return serviceRegisterRepository.findAll();
    }

    @Override
    public List<ServiceRegister> getServiceRegistersByEmployee(Long employeeId) {
        return serviceRegisterRepository.findByEmployeeId(employeeId);
    }

    @Override
    public void deleteServiceRegister(Long id) {
        serviceRegisterRepository.deleteById(id);
    }
}
