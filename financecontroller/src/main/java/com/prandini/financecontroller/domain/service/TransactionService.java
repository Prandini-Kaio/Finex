package com.prandini.financecontroller.domain.service;

import com.prandini.financecontroller.domain.model.CreditCard;
import com.prandini.financecontroller.domain.model.Transaction;
import com.prandini.financecontroller.domain.repository.CreditCardRepository;
import com.prandini.financecontroller.domain.repository.TransactionRepository;
import com.prandini.financecontroller.web.dto.TransactionRequest;
import com.prandini.financecontroller.web.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
public class TransactionService {

    private final TransactionRepository transactionRepository;
    private final CreditCardRepository creditCardRepository;

    public List<Transaction> listAll() {
        return transactionRepository.findAll(Sort.by(Sort.Direction.DESC, "date", "id"));
    }

    @Transactional
    public Transaction create(TransactionRequest request) {
        Transaction transaction = Transaction.builder()
                .date(request.date())
                .type(request.type())
                .paymentMethod(request.paymentMethod())
                .person(request.person())
                .category(request.category())
                .description(request.description())
                .value(request.value())
                .competency(request.competency())
                .installments(request.installments())
                .installmentNumber(request.installmentNumber())
                .totalInstallments(request.totalInstallments())
                .parentPurchaseId(request.parentPurchaseId())
                .build();

        if (request.creditCardId() != null) {
            CreditCard creditCard = creditCardRepository.findById(request.creditCardId())
                    .orElseThrow(() -> new ResourceNotFoundException("Cartão não encontrado: " + request.creditCardId()));
            transaction.setCreditCard(creditCard);
        }
        return transactionRepository.save(transaction);
    }

    @Transactional
    public void delete(Long id) {
        if (!transactionRepository.existsById(id)) {
            throw new ResourceNotFoundException("Transação não encontrada: " + id);
        }
        transactionRepository.deleteById(id);
    }

    public List<Transaction> listByDateRange(LocalDate startDate, LocalDate endDate) {
        if (startDate == null && endDate == null) {
            return listAll();
        }
        if (startDate == null) {
            startDate = LocalDate.of(1900, 1, 1);
        }
        if (endDate == null) {
            endDate = LocalDate.of(9999, 12, 31);
        }
        return transactionRepository.findByDateBetween(startDate, endDate);
    }
}

