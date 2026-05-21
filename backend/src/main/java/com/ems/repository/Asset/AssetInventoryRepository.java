package com.ems.repository.Asset;

import com.ems.entity.Asset.AssetInventory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface AssetInventoryRepository extends JpaRepository<AssetInventory, Long> {
    Optional<AssetInventory> findByAssetCode(String assetCode);
}