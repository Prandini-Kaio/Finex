package com.prandini.financecontroller.web.dto;

import com.prandini.financecontroller.domain.model.enums.PaymentMethod;
import com.prandini.financecontroller.domain.model.enums.TransactionType;

import java.math.BigDecimal;
import java.time.LocalDate;

public record TransactionPreviewRequest(
        LocalDate date,
        TransactionType type,
        PaymentMethod paymentMethod,
        BigDecimal value,
        Long creditCardId,
        Long bankAccountId,
        Integer totalInstallments
) {
}
