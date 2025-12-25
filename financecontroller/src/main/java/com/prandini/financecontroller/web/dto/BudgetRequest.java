package com.prandini.financecontroller.web.dto;

import com.prandini.financecontroller.domain.model.enums.BudgetType;

import java.math.BigDecimal;

public record BudgetRequest(
        String competency,
        String category,
        Long personId,
        BudgetType budgetType,
        BigDecimal amount,
        BigDecimal percentage
) {
}

