package com.prandini.financecontroller.web.dto;

public record CreditCardInvoiceRequest(
        String referenceMonth,
        Boolean paid
) {
}


