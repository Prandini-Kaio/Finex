package com.prandini.financecontroller.web.dto;

import java.math.BigDecimal;

public record PersonSplitResponse(
        Long splitWithPersonId,
        BigDecimal percentage
) {
}

