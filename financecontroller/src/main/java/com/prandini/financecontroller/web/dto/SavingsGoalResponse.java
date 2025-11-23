package com.prandini.financecontroller.web.dto;

import com.prandini.financecontroller.domain.model.enums.Person;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

public record SavingsGoalResponse(
        Long id,
        String name,
        BigDecimal targetAmount,
        BigDecimal currentAmount,
        LocalDate deadline,
        Person owner,
        String description,
        LocalDateTime createdAt,
        List<SavingsDepositResponse> deposits
) {
}

