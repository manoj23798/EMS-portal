package com.ems.repository.Asset;

import com.ems.entity.Asset.MaintenanceSchedule;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface MaintenanceScheduleRepository extends JpaRepository<MaintenanceSchedule, Long> {
    Optional<MaintenanceSchedule> findByAssetCode(String assetCode);
}