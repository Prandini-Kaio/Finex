package com.prandini.financecontroller.web.dto;

import com.prandini.financecontroller.domain.model.enums.PaymentMethod;
import com.prandini.financecontroller.domain.model.enums.TransactionType;

import java.math.BigDecimal;
import java.time.LocalDate;

public record RecurringTransactionRequest(
        String description,
        TransactionType type,
        PaymentMethod paymentMethod,
        Long personId,
        String category,
        BigDecimal value,
        LocalDate startDate,
        LocalDate endDate,
        Integer dayOfMonth,
        Long creditCardId,
        Boolean active,
        String baseCompetency
) {
}

