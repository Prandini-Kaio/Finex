package com.prandini.financecontroller.domain.service;

import com.prandini.financecontroller.domain.model.CreditCard;
import com.prandini.financecontroller.domain.model.Transaction;
import com.prandini.financecontroller.domain.model.enums.PaymentMethod;
import com.prandini.financecontroller.domain.repository.TransactionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

/**
 * Recalcula competência de transações de crédito existentes usando a regra de fechamento do cartão.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class CreditCompetencyMigrationRunner implements ApplicationRunner {

    private final TransactionRepository transactionRepository;
    private final CreditCardBillingService creditCardBillingService;

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        List<Transaction> creditTransactions = transactionRepository.findAll().stream()
                .filter(t -> t.getPaymentMethod() == PaymentMethod.CREDITO)
                .filter(t -> t.getCreditCard() != null)
                .toList();

        int updated = 0;
        for (Transaction t : creditTransactions) {
            CreditCard card = t.getCreditCard();
            LocalDate baseDate = t.getDate();
            if (baseDate == null) {
                continue;
            }
            if (t.getInstallmentNumber() != null && t.getInstallmentNumber() > 1) {
                baseDate = baseDate.plusMonths(t.getInstallmentNumber() - 1L);
            }
            String newCompetency = creditCardBillingService.resolveInvoiceCompetency(
                    baseDate, card.getClosingDay());
            if (!newCompetency.equals(t.getCompetency())) {
                t.setCompetency(newCompetency);
                transactionRepository.save(t);
                updated++;
            }
        }
        if (updated > 0) {
            log.info("Recalculadas {} competências de crédito com regra de fechamento", updated);
        }
    }
}
