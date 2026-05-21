package com.ems.repository.Asset;

import com.ems.entity.Asset.AssetLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AssetLogRepository extends JpaRepository<AssetLog, Long> {
    List<AssetLog> findByTableScopeIgnoreCase(String tableScope);
    List<AssetLog> findByRecordId(Long recordId);
}
