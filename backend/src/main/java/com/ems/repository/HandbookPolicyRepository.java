package com.ems.repository;

import com.ems.entity.HandbookPolicy;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface HandbookPolicyRepository extends JpaRepository<HandbookPolicy, Long> {
    
    @Query("SELECT p FROM HandbookPolicy p WHERE LOWER(p.title) LIKE LOWER(CONCAT('%', :query, '%')) OR LOWER(p.description) LIKE LOWER(CONCAT('%', :query, '%'))")
    List<HandbookPolicy> searchPolicies(@Param("query") String query);
}
