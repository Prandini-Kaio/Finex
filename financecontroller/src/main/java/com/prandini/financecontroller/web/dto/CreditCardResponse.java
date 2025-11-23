package com.prandini.financecontroller.web.dto;

import com.prandini.financecontroller.domain.model.enums.Person;

import java.math.BigDecimal;

public record CreditCardResponse(
        Long id,
        String name,
        Person owner,
        Integer closingDay,
        Integer dueDay,
        BigDecimal limit
) {
}

