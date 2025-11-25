package com.prandini.financecontroller.web.dto;

import com.prandini.financecontroller.domain.model.enums.Person;

import java.time.LocalDateTime;

public record CreditCardInvoiceResponse(
        Long creditCardId,
        String creditCardName,
        Person owner,
        String referenceMonth,
        boolean paid,
        LocalDateTime paidAt
) {
}


