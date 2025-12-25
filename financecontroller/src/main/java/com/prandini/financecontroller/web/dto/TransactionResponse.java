package com.prandini.financecontroller.web.dto;

import com.prandini.financecontroller.domain.model.enums.PaymentMethod;
import com.prandini.financecontroller.domain.model.enums.TransactionType;

import java.math.BigDecimal;
import java.time.LocalDate;

public record TransactionResponse(
        Long id,
        LocalDate date,
        TransactionType type,
        PaymentMethod paymentMethod,
        String person,
        String category,
        String description,
        BigDecimal value,
        String competency,
        Long creditCardId,
        String creditCardName,
        Integer installments,
        Integer installmentNumber,
        Integer totalInstallments,
        Long parentPurchaseId
) {
}

