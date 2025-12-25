package com.prandini.financecontroller.web.dto;

import java.math.BigDecimal;
import java.time.LocalDate;

public record SavingsDepositResponse(
        Long id,
        BigDecimal amount,
        LocalDate date,
        String person,
        String observacao
) {
}

