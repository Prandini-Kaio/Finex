package com.prandini.financecontroller.web.dto;

import com.prandini.financecontroller.domain.model.enums.BudgetType;

import java.math.BigDecimal;

public record BudgetResponse(
        Long id,
        String competency,
        String category,
        String person,
        BudgetType budgetType,
        BigDecimal amount,
        BigDecimal percentage
) {
}

