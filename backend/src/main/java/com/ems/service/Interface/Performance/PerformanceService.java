package com.ems.service.Interface.Performance;

import com.ems.entity.Performance.MonthlyPerformanceReview;
import com.ems.entity.Performance.PerformanceTemplate;
import com.ems.entity.Performance.ServiceRegister;

import java.util.List;
import java.util.Map;

public interface PerformanceService {
    // Template Management
    PerformanceTemplate createTemplate(PerformanceTemplate template);
    PerformanceTemplate updateTemplate(Long id, PerformanceTemplate template);
    List<PerformanceTemplate> getAllTemplates();
    PerformanceTemplate getTemplateById(Long id);
    void deleteTemplate(Long id);

    // Monthly Performance Review (MPR)
    MonthlyPerformanceReview createMPR(MonthlyPerformanceReview mpr);
    MonthlyPerformanceReview updateMPR(Long id, MonthlyPerformanceReview mpr);
    List<MonthlyPerformanceReview> getAllMPRs();
    List<MonthlyPerformanceReview> getMPRsByEmployee(Long employeeId);
    List<MonthlyPerformanceReview> getMPRsByManager(Long managerId);
    List<MonthlyPerformanceReview> getMPRsByEmployeeAndYear(Long employeeId, Integer year);
    MonthlyPerformanceReview getMPRById(Long id);
    
    // Analytics & Summaries
    Map<String, Object> getDashboardStats();

    // Service Register
    ServiceRegister createServiceRegister(ServiceRegister entry);
    ServiceRegister updateServiceRegister(Long id, ServiceRegister entry);
    List<ServiceRegister> getAllServiceRegisters();
    List<ServiceRegister> getServiceRegistersByEmployee(Long employeeId);
    void deleteServiceRegister(Long id);
}
