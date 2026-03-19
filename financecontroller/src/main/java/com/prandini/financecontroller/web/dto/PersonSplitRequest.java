package com.prandini.financecontroller.web.dto;

import java.math.BigDecimal;

public record PersonSplitRequest(
        Long splitWithPersonId,
        BigDecimal percentage
) {
}

