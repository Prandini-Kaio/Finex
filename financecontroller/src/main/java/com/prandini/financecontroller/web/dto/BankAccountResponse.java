package com.prandini.financecontroller.web.dto;

import java.math.BigDecimal;

public record BankAccountResponse(
        Long id,
        String name,
        String institution,
        String owner,
        Long ownerId,
        BigDecimal initialBalance,
        BigDecimal currentBalance,
        Boolean active
) {
}
