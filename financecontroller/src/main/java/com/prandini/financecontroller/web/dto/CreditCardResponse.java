package com.prandini.financecontroller.web.dto;

import java.math.BigDecimal;

public record CreditCardResponse(
        Long id,
        String name,
        String owner,
        Integer closingDay,
        Integer dueDay,
        BigDecimal limit
) {
}

