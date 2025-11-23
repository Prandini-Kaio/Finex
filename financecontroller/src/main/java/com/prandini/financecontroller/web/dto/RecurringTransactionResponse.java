package com.prandini.financecontroller.web.dto;

import com.prandini.financecontroller.domain.model.enums.PaymentMethod;
import com.prandini.financecontroller.domain.model.enums.Person;
import com.prandini.financecontroller.domain.model.enums.TransactionType;

import java.math.BigDecimal;
import java.time.LocalDate;

public record RecurringTransactionResponse(
        Long id,
        String description,
        TransactionType type,
        PaymentMethod paymentMethod,
        Person person,
        String category,
        BigDecimal value,
        LocalDate startDate,
        LocalDate endDate,
        Integer dayOfMonth,
        Long creditCardId,
        String creditCardName,
        Boolean active,
        String baseCompetency
) {
}

