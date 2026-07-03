package com.prandini.financecontroller.web.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

public record CreditCardInvoiceReceiptResponse(
        Long creditCardId,
        String creditCardName,
        String owner,
        String referenceMonth,
        BigDecimal invoiceAmount,
        LocalDateTime paidAt,
        Long paymentTransactionId,
        Long bankAccountId,
        String bankAccountName,
        BigDecimal accountBalanceAfterPayment,
        LocalDate paymentDate,
        String description
) {
}
