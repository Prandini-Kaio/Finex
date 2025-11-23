package com.prandini.financecontroller.web.dto;

import com.prandini.financecontroller.domain.model.enums.Person;

import java.math.BigDecimal;
import java.time.LocalDate;

public record SavingsGoalRequest(
        String name,
        BigDecimal targetAmount,
        LocalDate deadline,
        Person owner,
        String description
) {
}

