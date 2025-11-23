package com.prandini.financecontroller.web.dto;

import com.prandini.financecontroller.domain.model.enums.Person;

import java.math.BigDecimal;
import java.time.LocalDate;

public record SavingsDepositResponse(
        Long id,
        BigDecimal amount,
        LocalDate date,
        Person person
) {
}

