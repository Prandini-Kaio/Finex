package com.prandini.financecontroller.domain.service;

import com.prandini.financecontroller.web.dto.InstallmentPreviewItem;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Service
public class CreditCardBillingService {

    /**
     * Regra: compra após o dia de fechamento cai na fatura do mês seguinte.
     */
    public String resolveInvoiceCompetency(LocalDate purchaseDate, Integer closingDay) {
        if (purchaseDate == null) {
            throw new IllegalArgumentException("Data da compra é obrigatória");
        }
        int effectiveClosingDay = closingDay != null ? closingDay : 31;
        LocalDate invoiceMonth = purchaseDate.getDayOfMonth() > effectiveClosingDay
                ? purchaseDate.plusMonths(1)
                : purchaseDate;
        return formatCompetency(invoiceMonth);
    }

    public LocalDate resolveInstallmentDate(LocalDate purchaseDate, int installmentIndex) {
        return purchaseDate.plusMonths(installmentIndex - 1L);
    }

    public List<InstallmentPreviewItem> previewInstallments(
            LocalDate purchaseDate,
            BigDecimal totalValue,
            int totalInstallments,
            Integer closingDay) {
        if (totalInstallments < 1) {
            throw new IllegalArgumentException("Quantidade de parcelas deve ser pelo menos 1");
        }
        List<BigDecimal> values = splitTotalAcrossInstallments(totalValue, totalInstallments);
        List<InstallmentPreviewItem> items = new ArrayList<>();
        for (int i = 0; i < totalInstallments; i++) {
            LocalDate installmentDate = resolveInstallmentDate(purchaseDate, i + 1);
            String competency = resolveInvoiceCompetency(installmentDate, closingDay);
            items.add(new InstallmentPreviewItem(i + 1, installmentDate, competency, values.get(i)));
        }
        return items;
    }

    public String resolveNonCreditCompetency(LocalDate date) {
        return formatCompetency(date);
    }

    public static String formatCompetency(LocalDate date) {
        return String.format("%02d/%d", date.getMonthValue(), date.getYear());
    }

    public static List<BigDecimal> splitTotalAcrossInstallments(BigDecimal total, int n) {
        BigDecimal scaled = total != null ? total.setScale(2, RoundingMode.HALF_UP) : BigDecimal.ZERO;
        List<BigDecimal> parts = new ArrayList<>();
        if (n == 1) {
            parts.add(scaled);
            return parts;
        }
        BigDecimal each = scaled.divide(BigDecimal.valueOf(n), 2, RoundingMode.HALF_UP);
        BigDecimal allocated = BigDecimal.ZERO;
        for (int i = 0; i < n - 1; i++) {
            parts.add(each);
            allocated = allocated.add(each);
        }
        parts.add(scaled.subtract(allocated).setScale(2, RoundingMode.HALF_UP));
        return parts;
    }
}
