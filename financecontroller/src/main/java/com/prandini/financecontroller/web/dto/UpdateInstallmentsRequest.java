package com.prandini.financecontroller.web.dto;

import java.math.BigDecimal;
import java.time.LocalDate;

public record UpdateInstallmentsRequest(
        BigDecimal newTotalValue,
        LocalDate newPurchaseDate
) {
}
