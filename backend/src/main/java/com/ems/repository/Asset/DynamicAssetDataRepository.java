package com.ems.repository.Asset;

import com.ems.entity.Asset.DynamicAssetData;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface DynamicAssetDataRepository extends JpaRepository<DynamicAssetData, String> {
}
