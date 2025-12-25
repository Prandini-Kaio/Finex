package com.prandini.financecontroller.web.dto;

import java.time.LocalDateTime;

public record CreditCardInvoiceResponse(
        Long creditCardId,
        String creditCardName,
        String owner,
        String referenceMonth,
        boolean paid,
        LocalDateTime paidAt
) {
}


