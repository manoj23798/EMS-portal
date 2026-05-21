package com.ems.repository.Employee;

import com.ems.entity.Employee.EducationDetail;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface EducationDetailRepository extends JpaRepository<EducationDetail, Long> {
    List<EducationDetail> findByEmployeeId(Long employeeId);
}
