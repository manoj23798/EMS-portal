package com.ems.repository.Handbook;

import com.ems.entity.Handbook.HandbookVersion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface HandbookVersionRepository extends JpaRepository<HandbookVersion, Long> {
    List<HandbookVersion> findByPolicyIdOrderByUpdatedAtDesc(Long policyId);
}
