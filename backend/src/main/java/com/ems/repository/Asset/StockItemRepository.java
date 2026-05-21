package com.ems.repository.Asset;

import com.ems.entity.Asset.StockItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface StockItemRepository extends JpaRepository<StockItem, Long> {
    List<StockItem> findBySectionNameIgnoreCase(String sectionName);
}