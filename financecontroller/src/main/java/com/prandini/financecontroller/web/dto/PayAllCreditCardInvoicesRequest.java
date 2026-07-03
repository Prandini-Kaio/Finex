package com.prandini.financecontroller.web.dto;

import java.util.Map;

public record PayAllCreditCardInvoicesRequest(
        String referenceMonth,
        Boolean paid,
        Map<Long, Long> bankAccountIdByCardId
) {
}
