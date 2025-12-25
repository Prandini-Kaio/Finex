package com.prandini.financecontroller.web.dto;

import java.math.BigDecimal;
import java.time.LocalDate;

public record SavingsGoalRequest(
        String name,
        BigDecimal targetAmount,
        LocalDate deadline,
        Long ownerId,
        String description
) {
}

