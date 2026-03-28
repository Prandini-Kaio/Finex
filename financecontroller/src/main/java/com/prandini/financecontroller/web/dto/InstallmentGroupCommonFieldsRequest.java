package com.prandini.financecontroller.web.dto;

import com.prandini.financecontroller.domain.model.enums.PaymentMethod;
import com.prandini.financecontroller.domain.model.enums.TransactionType;

public record InstallmentGroupCommonFieldsRequest(
        Long personId,
        TransactionType type,
        PaymentMethod paymentMethod,
        Long creditCardId,
        String category,
        String description
) {
}
