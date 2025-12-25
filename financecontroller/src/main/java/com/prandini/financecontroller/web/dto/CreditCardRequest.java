package com.prandini.financecontroller.web.dto;

import java.math.BigDecimal;

public record CreditCardRequest(
        String name,
        Long ownerId,
        Integer closingDay,
        Integer dueDay,
        BigDecimal limit
) {
}

