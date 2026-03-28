package com.prandini.financecontroller.web.dto;

public record AnticipateInstallmentsRequest(
        int fromInstallmentNumber,
        int toInstallmentNumber,
        String targetCompetency
) {
}
