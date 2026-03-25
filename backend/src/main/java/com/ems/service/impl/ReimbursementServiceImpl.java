package com.ems.service.impl;

import com.ems.dto.request.ReimbursementRequest;
import com.ems.dto.response.ReimbursementResponse;
import com.ems.entity.*;
import com.ems.exception.ResourceNotFoundException;
import com.ems.repository.*;
import com.ems.service.ReimbursementService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class ReimbursementServiceImpl implements ReimbursementService {

    @Autowired
    private ReimbursementMasterRepository masterRepository;
    @Autowired
    private EmployeeRepository employeeRepository;

    @Override
    @Transactional
    public ReimbursementResponse submitReimbursement(ReimbursementRequest request) {
        Long employeeId = getLoggedInEmployeeId();
        Employee employee = employeeRepository.findById(employeeId)
                .orElseThrow(() -> new ResourceNotFoundException("Employee not found"));

        ReimbursementMaster rm = new ReimbursementMaster();
        rm.setEmployee(employee);
        rm.setReasonForTravel(request.getReasonForTravel());
        rm.setTravelStartDate(request.getTravelStartDate());
        rm.setTravelEndDate(request.getTravelEndDate());
        rm.setSubmissionDate(LocalDate.now());
        rm.setStatus("PENDING");
        rm.setAdvanceAmount(request.getAdvanceAmount() != null ? request.getAdvanceAmount() : 0.0);

        double totalClaimed = 0.0;

        // 1. Tickets
        if (request.getTickets() != null) {
            for (ReimbursementRequest.TicketDto tDto : request.getTickets()) {
                ReimbursementTicket t = new ReimbursementTicket();
                t.setTravelDate(tDto.getDate());
                t.setTravelFrom(tDto.getTravelFrom());
                t.setTravelTo(tDto.getTravelTo());
                t.setMode(tDto.getMode());
                t.setAmount(tDto.getAmount() != null ? tDto.getAmount() : 0.0);
                t.setAmountExpression(tDto.getAmountExpression());
                t.setPerson(tDto.getPerson());
                t.setTicketAvailable(tDto.getTicketAvailable() != null ? tDto.getTicketAvailable() : false);
                rm.addTicket(t);
                totalClaimed += t.getAmount();
            }
        }

        // 2. Lodging
        if (request.getLodgings() != null) {
            for (ReimbursementRequest.LodgingDto lDto : request.getLodgings()) {
                ReimbursementLodging l = new ReimbursementLodging();
                l.setDateRange(lDto.getDateRange());
                l.setLocation(lDto.getLocation());
                l.setDays(lDto.getDays() != null ? lDto.getDays() : 0);
                l.setPersons(lDto.getPersons() != null ? lDto.getPersons() : 0);
                l.setRatePerPerson(lDto.getRatePerPerson() != null ? lDto.getRatePerPerson() : 0.0);
                // Hard Backend Recalculation
                double calcAmount = l.getDays() * l.getPersons() * l.getRatePerPerson();
                l.setAmount(calcAmount);
                l.setBillAvailable(lDto.getBillAvailable() != null ? lDto.getBillAvailable() : false);
                rm.addLodging(l);
                totalClaimed += calcAmount;
            }
        }

        // 3. Local Conveyance
        if (request.getConveyances() != null) {
            for (ReimbursementRequest.LocalConveyanceDto cDto : request.getConveyances()) {
                ReimbursementLocalConveyance c = new ReimbursementLocalConveyance();
                c.setDate(cDto.getDate());
                c.setLocationFrom(cDto.getLocationFrom());
                c.setLocationTo(cDto.getLocationTo());
                c.setModeOfTravel(cDto.getModeOfTravel());
                c.setAmount(cDto.getAmount() != null ? cDto.getAmount() : 0.0);
                c.setTicketAvailable(cDto.getTicketAvailable() != null ? cDto.getTicketAvailable() : false);
                rm.addConveyance(c);
                totalClaimed += c.getAmount();
            }
        }

        // 4. Food
        if (request.getFoods() != null) {
            for (ReimbursementRequest.FoodDto fDto : request.getFoods()) {
                ReimbursementFood f = new ReimbursementFood();
                f.setDate(fDto.getDate());
                f.setMorning(fDto.getMorning() != null ? fDto.getMorning() : 0.0);
                f.setAfternoon(fDto.getAfternoon() != null ? fDto.getAfternoon() : 0.0);
                f.setEvening(fDto.getEvening() != null ? fDto.getEvening() : 0.0);
                f.setNight(fDto.getNight() != null ? fDto.getNight() : 0.0);
                f.setGst(fDto.getGst());
                f.setSgst(fDto.getSgst());
                f.setBillAvailable(fDto.getBillAvailable() != null ? fDto.getBillAvailable() : false);
                // Hard Backend Recalculation
                double foodTotal = f.getMorning() + f.getAfternoon() + f.getEvening() + f.getNight();
                f.setTotal(foodTotal);
                rm.addFood(f);
                totalClaimed += foodTotal;
            }
        }

        // 5. Others
        if (request.getOthers() != null) {
            for (ReimbursementRequest.OthersDto oDto : request.getOthers()) {
                ReimbursementOthers o = new ReimbursementOthers();
                o.setDate(oDto.getDate());
                o.setDescription(oDto.getDescription());
                o.setAmount(oDto.getAmount() != null ? oDto.getAmount() : 0.0);
                o.setBillAvailable(oDto.getBillAvailable() != null ? oDto.getBillAvailable() : false);
                rm.addOther(o);
                totalClaimed += o.getAmount();
            }
        }

        // 6. Wages
        if (request.getWages() != null) {
            for (ReimbursementRequest.WagesDto wDto : request.getWages()) {
                ReimbursementWages w = new ReimbursementWages();
                w.setName(wDto.getName());
                w.setFromDate(wDto.getFromDate());
                w.setToDate(wDto.getToDate());
                w.setDaysWorked(wDto.getDaysWorked() != null ? wDto.getDaysWorked() : 0.0);
                w.setPerDaySalary(wDto.getPerDaySalary() != null ? wDto.getPerDaySalary() : 0.0);
                // Hard Backend Recalculation
                double wageTotal = w.getDaysWorked() * w.getPerDaySalary();
                w.setTotalAmount(wageTotal);
                rm.addWage(w);
                totalClaimed += wageTotal;
            }
        }

        rm.setTotalAmountClaimed(totalClaimed);
        // Formula specified by user: amountToReturn = advance - totalClaimed (negative means employee receives money)
        rm.setAmountToReturn(rm.getAdvanceAmount() - totalClaimed);

        ReimbursementMaster saved = masterRepository.save(rm);
        return mapToResponse(saved);
    }

    @Override
    public List<ReimbursementResponse> getMyReimbursements() {
        Long employeeId = getLoggedInEmployeeId();
        return masterRepository.findByEmployeeId(employeeId).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    public List<ReimbursementResponse> getAllPendingForManager() {
        return masterRepository.findByStatus("PENDING").stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    public List<ReimbursementResponse> getAllForAccounts() {
        return masterRepository.findAll().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    public ReimbursementResponse getReimbursementById(Long id) {
        ReimbursementMaster rm = masterRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Reimbursement record not found"));
        return mapToResponse(rm);
    }

    @Override
    @Transactional
    public ReimbursementResponse managerApproveOrReject(Long id, boolean approve) {
        ReimbursementMaster rm = masterRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Reimbursement record not found"));
        
        if (!rm.getStatus().equals("PENDING")) {
            throw new RuntimeException("Reimbursement is not in PENDING state");
        }

        rm.setStatus(approve ? "MANAGER_APPROVED" : "REJECTED");
        rm.setManagerApprovalDate(LocalDate.now());
        rm.setManagerApprovalBy(getLoggedInUsername());
        
        return mapToResponse(masterRepository.save(rm));
    }

    @Override
    @Transactional
    public ReimbursementResponse accountsSettle(Long id, Double approvedAmount, String reason) {
        ReimbursementMaster rm = masterRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Reimbursement record not found"));
        
        if (!rm.getStatus().equals("MANAGER_APPROVED")) {
            throw new RuntimeException("Reimbursement must be MANAGER_APPROVED first before settlement");
        }

        rm.setStatus("ACCOUNTS_SETTLED");
        rm.setAccountsApprovedAmount(approvedAmount != null ? approvedAmount : rm.getTotalAmountClaimed());
        rm.setAccountsReason(reason);
        rm.setAccountsApprovalDate(LocalDate.now());
        rm.setAccountsApprovalBy(getLoggedInUsername());
        
        return mapToResponse(masterRepository.save(rm));
    }

    private ReimbursementResponse mapToResponse(ReimbursementMaster rm) {
        ReimbursementResponse res = new ReimbursementResponse();
        res.setId(rm.getId());
        if (rm.getEmployee() != null) {
            res.setEmployeeName(rm.getEmployee().getFirstName() + " " + rm.getEmployee().getLastName());
            res.setEmployeeCode(rm.getEmployee().getEmployeeId()); // Using employeeId string if it's the code
            if (rm.getEmployee().getDesignation() != null) {
                res.setDesignation(rm.getEmployee().getDesignation().getTitle());
            }
        }
        res.setReasonForTravel(rm.getReasonForTravel());
        res.setTravelStartDate(rm.getTravelStartDate());
        res.setTravelEndDate(rm.getTravelEndDate());
        res.setSubmissionDate(rm.getSubmissionDate());
        res.setStatus(rm.getStatus());
        res.setTotalAmountClaimed(rm.getTotalAmountClaimed());
        res.setAdvanceAmount(rm.getAdvanceAmount());
        res.setAmountToReturn(rm.getAmountToReturn());
        res.setManagerApprovalDate(rm.getManagerApprovalDate());
        res.setManagerApprovalBy(rm.getManagerApprovalBy());
        res.setAccountsApprovedAmount(rm.getAccountsApprovedAmount());
        res.setAccountsReason(rm.getAccountsReason());
        res.setAccountsApprovalDate(rm.getAccountsApprovalDate());
        res.setAccountsApprovalBy(rm.getAccountsApprovalBy());

        // Map Tickets
        if (rm.getTickets() != null) {
            res.setTickets(rm.getTickets().stream().map(t -> {
                ReimbursementResponse.TicketDto dto = new ReimbursementResponse.TicketDto();
                dto.setId(t.getId());
                dto.setDate(t.getTravelDate());
                dto.setTravelFrom(t.getTravelFrom());
                dto.setTravelTo(t.getTravelTo());
                dto.setMode(t.getMode());
                dto.setAmount(t.getAmount());
                dto.setAmountExpression(t.getAmountExpression());
                dto.setPerson(t.getPerson());
                dto.setTicketAvailable(t.getTicketAvailable());
                dto.setTicketFile(t.getTicketFile());
                return dto;
            }).collect(Collectors.toList()));
        }

        // Map Lodgings
        if (rm.getLodgings() != null) {
            res.setLodgings(rm.getLodgings().stream().map(l -> {
                ReimbursementResponse.LodgingDto dto = new ReimbursementResponse.LodgingDto();
                dto.setId(l.getId());
                dto.setDateRange(l.getDateRange());
                dto.setLocation(l.getLocation());
                dto.setDays(l.getDays());
                dto.setPersons(l.getPersons());
                dto.setRatePerPerson(l.getRatePerPerson());
                dto.setAmount(l.getAmount());
                dto.setBillAvailable(l.getBillAvailable());
                dto.setBillFile(l.getBillFile());
                return dto;
            }).collect(Collectors.toList()));
        }

        // Map Conveyances
        if (rm.getConveyances() != null) {
            res.setConveyances(rm.getConveyances().stream().map(c -> {
                ReimbursementResponse.LocalConveyanceDto dto = new ReimbursementResponse.LocalConveyanceDto();
                dto.setId(c.getId());
                dto.setDate(c.getDate());
                dto.setLocationFrom(c.getLocationFrom());
                dto.setLocationTo(c.getLocationTo());
                dto.setModeOfTravel(c.getModeOfTravel());
                dto.setAmount(c.getAmount());
                dto.setTicketAvailable(c.getTicketAvailable());
                dto.setTicketFile(c.getTicketFile());
                return dto;
            }).collect(Collectors.toList()));
        }

        // Map Foods
        if (rm.getFoods() != null) {
            res.setFoods(rm.getFoods().stream().map(f -> {
                ReimbursementResponse.FoodDto dto = new ReimbursementResponse.FoodDto();
                dto.setId(f.getId());
                dto.setDate(f.getDate());
                dto.setMorning(f.getMorning());
                dto.setAfternoon(f.getAfternoon());
                dto.setEvening(f.getEvening());
                dto.setNight(f.getNight());
                dto.setTotal(f.getTotal());
                dto.setGst(f.getGst());
                dto.setSgst(f.getSgst());
                dto.setBillAvailable(f.getBillAvailable());
                dto.setBillFile(f.getBillFile());
                return dto;
            }).collect(Collectors.toList()));
        }

        // Map Others
        if (rm.getOthers() != null) {
            res.setOthers(rm.getOthers().stream().map(o -> {
                ReimbursementResponse.OthersDto dto = new ReimbursementResponse.OthersDto();
                dto.setId(o.getId());
                dto.setDate(o.getDate());
                dto.setDescription(o.getDescription());
                dto.setAmount(o.getAmount());
                dto.setBillAvailable(o.getBillAvailable());
                dto.setBillFile(o.getBillFile());
                return dto;
            }).collect(Collectors.toList()));
        }

        // Map Wages
        if (rm.getWages() != null) {
            res.setWages(rm.getWages().stream().map(w -> {
                ReimbursementResponse.WagesDto dto = new ReimbursementResponse.WagesDto();
                dto.setId(w.getId());
                dto.setName(w.getName());
                dto.setFromDate(w.getFromDate());
                dto.setToDate(w.getToDate());
                dto.setDaysWorked(w.getDaysWorked());
                dto.setPerDaySalary(w.getPerDaySalary());
                dto.setTotalAmount(w.getTotalAmount());
                return dto;
            }).collect(Collectors.toList()));
        }

        return res;
    }

    @Autowired
    private UserRepository userRepository;

    private Long getLoggedInEmployeeId() {
        org.springframework.security.core.userdetails.UserDetails userDetails = 
          (org.springframework.security.core.userdetails.UserDetails) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        
        com.ems.entity.User user = userRepository.findByUsername(userDetails.getUsername())
                .orElseThrow(() -> new ResourceNotFoundException("Logged in user not found"));
        
        return user.getEmployee().getId();
    }

    private String getLoggedInUsername() {
        org.springframework.security.core.userdetails.UserDetails userDetails = 
          (org.springframework.security.core.userdetails.UserDetails) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        return userDetails.getUsername();
    }
}
