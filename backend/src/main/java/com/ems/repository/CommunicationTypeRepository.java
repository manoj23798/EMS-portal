package com.ems.repository;

import com.ems.entity.CommunicationType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface CommunicationTypeRepository extends JpaRepository<CommunicationType, Long> {
    Optional<CommunicationType> findByTypeName(String typeName);
}
