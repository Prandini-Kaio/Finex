package com.prandini.financecontroller.web.dto;

import java.math.BigDecimal;
import java.util.List;

public record TransactionPreviewResponse(
        String invoiceCompetency,
        Integer dueDay,
        List<InstallmentPreviewItem> installments,
        BigDecimal bankAccountCurrentBalance,
        BigDecimal bankAccountBalanceAfter,
        String bankAccountName
) {
}
