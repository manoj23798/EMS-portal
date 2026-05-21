package com.ems.repository.Performance;

import com.ems.entity.Performance.ServiceRegister;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface ServiceRegisterRepository extends JpaRepository<ServiceRegister, Long> {
    List<ServiceRegister> findByEmployeeId(Long employeeId);
    List<ServiceRegister> findByCategory(String category);
}
