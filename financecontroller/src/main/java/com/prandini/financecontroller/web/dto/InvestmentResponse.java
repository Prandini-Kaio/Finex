package com.prandini.financecontroller.web.dto;

import com.prandini.financecontroller.domain.model.enums.InvestmentType;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

public record InvestmentResponse(
        Long id,
        String name,
        InvestmentType type,
        String owner,
        BigDecimal investedAmount,
        LocalDate investmentDate,
        BigDecimal annualRate,
        BigDecimal currentValue,
        String description,
        String institution,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
}

