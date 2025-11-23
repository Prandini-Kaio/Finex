package com.prandini.financecontroller.web.dto;

import com.prandini.financecontroller.domain.model.enums.Person;

import java.math.BigDecimal;

public record CreditCardRequest(
        String name,
        Person owner,
        Integer closingDay,
        Integer dueDay,
        BigDecimal limit
) {
}

