package com.ems.repository.Asset;

import com.ems.entity.Asset.CategoryAsset;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface CategoryAssetRepository extends JpaRepository<CategoryAsset, Long> {
    Optional<CategoryAsset> findByAssetCode(String assetCode);
}