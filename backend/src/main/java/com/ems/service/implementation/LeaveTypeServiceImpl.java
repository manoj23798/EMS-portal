package com.ems.service.implementation;

import com.ems.entity.leave_And_permission.LeaveType;
import com.ems.repository.Leave_and_permission.LeaveTypeRepository;
import com.ems.service.Interface.LeaveTypeService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class LeaveTypeServiceImpl implements LeaveTypeService {

    private final LeaveTypeRepository leaveTypeRepository;

    private static final String PLANNED_LEAVE = "Planned Leave";
    private static final String URGENT_LEAVE = "Urgent Leave";

    @Override
    public List<LeaveType> getAllLeaveTypes() {
        ensureDefaultLeaveTypes();
        return leaveTypeRepository.findAll().stream()
                .filter(type -> isSupportedLeaveType(type.getName()))
                .sorted(Comparator.comparingInt(type -> PLANNED_LEAVE.equalsIgnoreCase(type.getName()) ? 0 : 1))
                .collect(Collectors.toList());
    }

    @Override
    public LeaveType getLeaveTypeById(Long id) {
        return leaveTypeRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Leave type not found with id: " + id));
    }

    @Override
    public LeaveType createLeaveType(LeaveType leaveType) {
        if (!isSupportedLeaveType(leaveType.getName())) {
            throw new RuntimeException("Only Planned Leave and Urgent Leave are allowed.");
        }
        return leaveTypeRepository.save(leaveType);
    }

    @Override
    public LeaveType updateLeaveType(Long id, LeaveType leaveType) {
        LeaveType existing = getLeaveTypeById(id);
        if (!isSupportedLeaveType(leaveType.getName())) {
            throw new RuntimeException("Only Planned Leave and Urgent Leave are allowed.");
        }
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

    private void ensureDefaultLeaveTypes() {
        List<LeaveType> existingTypes = leaveTypeRepository.findAll();
        Map<String, LeaveType> byName = existingTypes.stream()
                .collect(Collectors.toMap(type -> normalize(type.getName()), type -> type, (a, b) -> a));

        List<LeaveType> toCreate = new ArrayList<>();
        if (!byName.containsKey(normalize(PLANNED_LEAVE))) {
            LeaveType planned = new LeaveType();
            planned.setName(PLANNED_LEAVE);
            planned.setPaid(true);
            planned.setTotalDays(0);
            planned.setColor("#2563eb");
            planned.setRequireApproval(true);
            planned.setRequireAttachment(false);
            planned.setCarryForward(false);
            planned.setApplicableAfterMonths(0);
            toCreate.add(planned);
        }

        if (!byName.containsKey(normalize(URGENT_LEAVE))) {
            LeaveType urgent = new LeaveType();
            urgent.setName(URGENT_LEAVE);
            urgent.setPaid(true);
            urgent.setTotalDays(0);
            urgent.setColor("#ea580c");
            urgent.setRequireApproval(true);
            urgent.setRequireAttachment(false);
            urgent.setCarryForward(false);
            urgent.setApplicableAfterMonths(0);
            toCreate.add(urgent);
        }

        if (!toCreate.isEmpty()) {
            leaveTypeRepository.saveAll(toCreate);
        }
    }

    private boolean isSupportedLeaveType(String name) {
        String normalized = normalize(name);
        return normalize(PLANNED_LEAVE).equals(normalized) || normalize(URGENT_LEAVE).equals(normalized);
    }

    private String normalize(String name) {
        return name == null ? "" : name.trim().toLowerCase();
    }
}
