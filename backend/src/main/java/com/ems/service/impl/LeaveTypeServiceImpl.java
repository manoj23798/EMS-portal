package com.ems.service.impl;

import com.ems.entity.LeaveType;
import com.ems.repository.LeaveTypeRepository;
import com.ems.service.LeaveTypeService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class LeaveTypeServiceImpl implements LeaveTypeService {

    private final LeaveTypeRepository leaveTypeRepository;

    @Override
    public List<LeaveType> getAllLeaveTypes() {
        return leaveTypeRepository.findAll();
    }

    @Override
    public LeaveType getLeaveTypeById(Long id) {
        return leaveTypeRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Leave type not found with id: " + id));
    }

    @Override
    public LeaveType createLeaveType(LeaveType leaveType) {
        return leaveTypeRepository.save(leaveType);
    }

    @Override
    public LeaveType updateLeaveType(Long id, LeaveType leaveType) {
        LeaveType existing = getLeaveTypeById(id);
        existing.setName(leaveType.getName());
        existing.setPaid(leaveType.isPaid());
        existing.setTotalDays(leaveType.getTotalDays());
        existing.setColor(leaveType.getColor());
        existing.setRequireApproval(leaveType.isRequireApproval());
        existing.setRequireAttachment(leaveType.isRequireAttachment());
        existing.setCarryForward(leaveType.isCarryForward());
        existing.setMonthlyLimit(leaveType.getMonthlyLimit());
        existing.setApplicableAfterMonths(leaveType.getApplicableAfterMonths());
        existing.setGenderRestriction(leaveType.getGenderRestriction());
        return leaveTypeRepository.save(existing);
    }

    @Override
    public void deleteLeaveType(Long id) {
        leaveTypeRepository.deleteById(id);
    }
}
