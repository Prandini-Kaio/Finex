package com.prandini.financecontroller.domain.repository;

import com.prandini.financecontroller.domain.model.CreditCardInvoice;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface CreditCardInvoiceRepository extends JpaRepository<CreditCardInvoice, Long> {

    Optional<CreditCardInvoice> findByCreditCardIdAndReferenceMonth(Long creditCardId, String referenceMonth);

    List<CreditCardInvoice> findByReferenceMonth(String referenceMonth);
}


