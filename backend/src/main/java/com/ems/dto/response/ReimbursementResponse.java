package com.ems.dto.response;

import lombok.Data;
import java.time.LocalDate;
import java.util.List;

@Data
public class ReimbursementResponse {

    private Long id;
    private String employeeName;
    private String employeeCode;
    private String designation;
    
    private String reasonForTravel;
    private String travelStartDate;
    private String travelEndDate;
    private LocalDate submissionDate;
    private String status;
    
    // Calculations
    private Double totalAmountClaimed;
    private Double advanceAmount;
    private Double amountToReturn;
    
    // Sub-totals for display
    private Double ticketTotal;
    private Double lodgingTotal;
    private Double conveyTotal;
    private Double foodTotal;
    private Double otherTotal;
    private Double wageTotal;

    // Approvals
    private LocalDate managerApprovalDate;
    private String managerApprovalBy;
    
    private Double accountsApprovedAmount;
    private String accountsReason;
    private LocalDate accountsApprovalDate;
    private String accountsApprovalBy;

    // Sub-items
    private List<TicketDto> tickets;
    private List<LodgingDto> lodgings;
    private List<LocalConveyanceDto> conveyances;
    private List<FoodDto> foods;
    private List<OthersDto> others;
    private List<WagesDto> wages;

    @Data
    public static class TicketDto {
        private Long id;
        private String date;
        private String travelFrom;
        private String travelTo;
        private String mode;
        private Double amount;
        private String amountExpression;
        private String person;
        private Boolean ticketAvailable;
        private String ticketFile;
    }

    @Data
    public static class LodgingDto {
        private Long id;
        private String dateRange;
        private String location;
        private Integer days;
        private Integer persons;
        private Double ratePerPerson;
        private Double amount;
        private Boolean billAvailable;
        private String billFile;
    }

    @Data
    public static class LocalConveyanceDto {
        private Long id;
        private String date;
        private String locationFrom;
        private String locationTo;
        private String modeOfTravel;
        private Double amount;
        private Boolean ticketAvailable;
        private String ticketFile;
    }

    @Data
    public static class FoodDto {
        private Long id;
        private String date;
        private Double morning;
        private Double afternoon;
        private Double evening;
        private Double night;
        private Double total;
        private Double gst;
        private Double sgst;
        private Boolean billAvailable;
        private String billFile;
    }

    @Data
    public static class OthersDto {
        private Long id;
        private String date;
        private String description;
        private Double amount;
        private Boolean billAvailable;
        private String billFile;
    }

    @Data
    public static class WagesDto {
        private Long id;
        private String name;
        private String fromDate;
        private String toDate;
        private Double daysWorked;
        private Double perDaySalary;
        private Double totalAmount;
    }
}
