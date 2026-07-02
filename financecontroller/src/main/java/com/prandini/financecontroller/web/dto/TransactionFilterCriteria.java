package com.prandini.financecontroller.web.dto;

import com.prandini.financecontroller.domain.model.enums.PaymentMethod;

import java.util.List;

public record TransactionFilterCriteria(
        List<String> competencies,
        List<String> persons,
        List<String> categories,
        List<PaymentMethod> paymentMethods,
        List<Long> creditCardIds,
        Boolean withoutCreditCard
) {
    public boolean hasAnyFilter() {
        return isNotEmpty(competencies)
                || isNotEmpty(persons)
                || isNotEmpty(categories)
                || isNotEmpty(paymentMethods)
                || isNotEmpty(creditCardIds)
                || Boolean.TRUE.equals(withoutCreditCard);
    }

    private static boolean isNotEmpty(List<?> list) {
        return list != null && !list.isEmpty();
    }
}
