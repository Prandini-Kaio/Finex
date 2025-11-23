package com.prandini.financecontroller.web.dto;

import com.prandini.financecontroller.domain.model.enums.BudgetType;
import com.prandini.financecontroller.domain.model.enums.Person;

import java.math.BigDecimal;

public record BudgetResponse(
        Long id,
        String competency,
        String category,
        Person person,
        BudgetType budgetType,
        BigDecimal amount,
        BigDecimal percentage
) {
}

