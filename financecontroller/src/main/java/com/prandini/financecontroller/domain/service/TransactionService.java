package com.prandini.financecontroller.domain.service;

import com.prandini.financecontroller.domain.model.CreditCard;
import com.prandini.financecontroller.domain.model.Person;
import com.prandini.financecontroller.domain.model.Transaction;
import com.prandini.financecontroller.domain.repository.CreditCardRepository;
import com.prandini.financecontroller.domain.repository.PersonRepository;
import com.prandini.financecontroller.domain.repository.TransactionRepository;
import com.prandini.financecontroller.web.dto.TransactionRequest;
import com.prandini.financecontroller.web.dto.UpdateInstallmentsRequest;
import com.prandini.financecontroller.web.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Service
@RequiredArgsConstructor
public class TransactionService {

    private final TransactionRepository transactionRepository;
    private final CreditCardRepository creditCardRepository;
    private final PersonRepository personRepository;

    public List<Transaction> listAll() {
        return transactionRepository.findAll(Sort.by(Sort.Direction.DESC, "date", "id"));
    }

    @Transactional
    public Transaction create(TransactionRequest request) {
        Person person = personRepository.findById(request.personId())
                .orElseThrow(() -> new ResourceNotFoundException("Pessoa não encontrada: " + request.personId()));
        
        Transaction transaction = Transaction.builder()
                .date(request.date())
                .type(request.type())
                .paymentMethod(request.paymentMethod())
                .person(person)
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
    public Transaction update(Long id, TransactionRequest request) {
        Transaction transaction = transactionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Transação não encontrada: " + id));

        Person person = personRepository.findById(request.personId())
                .orElseThrow(() -> new ResourceNotFoundException("Pessoa não encontrada: " + request.personId()));

        transaction.setDate(request.date());
        transaction.setType(request.type());
        transaction.setPaymentMethod(request.paymentMethod());
        transaction.setPerson(person);
        transaction.setCategory(request.category());
        transaction.setDescription(request.description());
        transaction.setValue(request.value());
        transaction.setCompetency(request.competency());
        transaction.setInstallments(request.installments());
        transaction.setInstallmentNumber(request.installmentNumber());
        transaction.setTotalInstallments(request.totalInstallments());
        transaction.setParentPurchaseId(request.parentPurchaseId());

        if (request.creditCardId() != null) {
            CreditCard creditCard = creditCardRepository.findById(request.creditCardId())
                    .orElseThrow(() -> new ResourceNotFoundException("Cartão não encontrado: " + request.creditCardId()));
            transaction.setCreditCard(creditCard);
        } else {
            transaction.setCreditCard(null);
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

    public List<Transaction> getInstallmentsByParentPurchaseId(Long parentPurchaseId) {
        return transactionRepository.findByParentPurchaseId(parentPurchaseId);
    }

    @Transactional
    public void deleteAllInstallments(Long parentPurchaseId) {
        if (parentPurchaseId == null) {
            throw new IllegalArgumentException("parentPurchaseId não pode ser nulo");
        }
        transactionRepository.deleteByParentPurchaseId(parentPurchaseId);
    }

    @Transactional
    public List<Transaction> updateInstallments(Long parentPurchaseId, UpdateInstallmentsRequest request) {
        List<Transaction> installments = transactionRepository.findByParentPurchaseId(parentPurchaseId);
        if (installments.isEmpty()) {
            throw new ResourceNotFoundException("Nenhuma parcela encontrada para parentPurchaseId: " + parentPurchaseId);
        }

        Transaction firstInstallment = installments.get(0);
        int totalInstallments = installments.size();
        
        BigDecimal newTotalValue = request.newTotalValue() != null 
            ? request.newTotalValue() 
            : installments.stream()
                .map(Transaction::getValue)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        
        LocalDate newPurchaseDate = request.newPurchaseDate() != null 
            ? request.newPurchaseDate() 
            : firstInstallment.getDate();

        BigDecimal installmentValue = newTotalValue.divide(BigDecimal.valueOf(totalInstallments), 2, RoundingMode.HALF_UP);

        for (int i = 0; i < installments.size(); i++) {
            Transaction installment = installments.get(i);
            LocalDate installmentDate = newPurchaseDate.plusMonths(i);
            String competency = String.format("%02d/%d", installmentDate.getMonthValue(), installmentDate.getYear());
            
            installment.setValue(installmentValue);
            installment.setDate(installmentDate);
            installment.setCompetency(competency);
            
            transactionRepository.save(installment);
        }

        return transactionRepository.findByParentPurchaseId(parentPurchaseId);
    }
}

