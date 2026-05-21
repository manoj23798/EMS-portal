package com.ems.repository.Asset;

import com.ems.entity.Asset.MaintenanceChecklist;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface MaintenanceChecklistRepository extends JpaRepository<MaintenanceChecklist, Long> {
}