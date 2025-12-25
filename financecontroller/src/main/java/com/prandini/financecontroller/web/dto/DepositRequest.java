package com.prandini.financecontroller.web.dto;

import java.math.BigDecimal;
import java.time.LocalDate;

public record DepositRequest(
        BigDecimal amount,
        LocalDate date,
        Long personId,
        String observacao
) {
}

