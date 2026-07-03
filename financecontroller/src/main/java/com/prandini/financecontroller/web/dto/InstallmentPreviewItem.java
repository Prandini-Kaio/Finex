package com.prandini.financecontroller.web.dto;

import java.math.BigDecimal;
import java.time.LocalDate;

public record InstallmentPreviewItem(
        int installmentNumber,
        LocalDate date,
        String competency,
        BigDecimal value
) {
}
