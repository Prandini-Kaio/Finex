package com.prandini.financecontroller.web.dto;

import com.prandini.financecontroller.domain.model.enums.InvestmentType;
import com.prandini.financecontroller.domain.model.enums.Person;

import java.math.BigDecimal;
import java.time.LocalDate;

public record InvestmentRequest(
        String name,
        InvestmentType type,
        Person owner,
        BigDecimal investedAmount,
        LocalDate investmentDate,
        BigDecimal annualRate,
        BigDecimal currentValue,
        String description,
        String institution
) {
}

