package com.prandini.financecontroller.web.dto;

import java.math.BigDecimal;

public record BankAccountRequest(
        String name,
        String institution,
        Long ownerId,
        BigDecimal initialBalance,
        Boolean active
) {
}
