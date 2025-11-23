package com.prandini.financecontroller.web.dto;

import java.math.BigDecimal;
import java.time.LocalDate;

public record ImportTransactionRequest(
        LocalDate date,
        String type,
        String paymentMethod,
        String person,
        String category,
        String description,
        BigDecimal value,
        String competency,
        String creditCardName,
        Integer installments
) {
}


