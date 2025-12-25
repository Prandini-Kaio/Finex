package com.prandini.financecontroller.web.dto;

import com.prandini.financecontroller.domain.model.enums.PaymentMethod;
import com.prandini.financecontroller.domain.model.enums.TransactionType;

import java.math.BigDecimal;
import java.time.LocalDate;

public record TransactionRequest(
        LocalDate date,
        TransactionType type,
        PaymentMethod paymentMethod,
        Long personId,
        String category,
        String description,
        BigDecimal value,
        String competency,
        Long creditCardId,
        Integer installments,
        Integer installmentNumber,
        Integer totalInstallments,
        Long parentPurchaseId
) {
}

