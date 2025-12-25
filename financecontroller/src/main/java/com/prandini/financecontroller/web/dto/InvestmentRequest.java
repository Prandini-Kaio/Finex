package com.prandini.financecontroller.web.dto;

import com.prandini.financecontroller.domain.model.enums.InvestmentType;

import java.math.BigDecimal;
import java.time.LocalDate;

public record InvestmentRequest(
        String name,
        InvestmentType type,
        Long ownerId,
        BigDecimal investedAmount,
        LocalDate investmentDate,
        BigDecimal annualRate,
        BigDecimal currentValue,
        String description,
        String institution
) {
}

