package com.ems.repository.Communication;

import com.ems.entity.Communication.CommunicationTarget;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CommunicationTargetRepository extends JpaRepository<CommunicationTarget, Long> {
    List<CommunicationTarget> findByCommunicationId(Long communicationId);
    void deleteByCommunicationId(Long communicationId);
}
