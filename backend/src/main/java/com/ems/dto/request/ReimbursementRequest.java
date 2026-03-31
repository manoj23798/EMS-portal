package com.ems.dto.request;

import lombok.Data;
import java.util.List;

@Data
public class ReimbursementRequest {
    
    private String reasonForTravel;
    private String travelStartDate;
    private String travelEndDate;
    private Double advanceAmount;

    private List<TicketDto> tickets;
    private List<LodgingDto> lodgings;
    private List<LocalConveyanceDto> conveyances;
    private List<FoodDto> foods;
    private List<OthersDto> others;
    private List<WagesDto> wages;

    @Data
    public static class TicketDto {
        private String date;
        private String travelFrom;
        private String travelTo;
        private String mode;
        private Double amount;
        private String amountExpression;
        private String person;
        private Boolean ticketAvailable;
        private String billImage;
    }

    @Data
    public static class LodgingDto {
        private String dateRange;
        private String location;
        private Integer days;
        private Integer persons;
        private Double ratePerPerson;
        private Boolean billAvailable;
        private String billImage;
    }

    @Data
    public static class LocalConveyanceDto {
        private String date;
        private String locationFrom;
        private String locationTo;
        private String modeOfTravel;
        private Double amount;
        private Boolean ticketAvailable;
        private String billImage;
    }

    @Data
    public static class FoodDto {
        private String date;
        private Double morning;
        private Double afternoon;
        private Double evening;
        private Double night;
        private Double gst;
        private Double sgst;
        private Boolean billAvailable;
        private String billImage;
    }

    @Data
    public static class OthersDto {
        private String date;
        private String description;
        private Double amount;
        private Boolean billAvailable;
        private String billImage;
    }

    @Data
    public static class WagesDto {
        private String name;
        private String fromDate;
        private String toDate;
        private Double daysWorked;
        private Double perDaySalary;
        private String billImage;
    }
}
