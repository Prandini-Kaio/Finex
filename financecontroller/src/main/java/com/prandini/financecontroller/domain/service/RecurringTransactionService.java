package com.prandini.financecontroller.domain.service;

import com.prandini.financecontroller.domain.model.CreditCard;
import com.prandini.financecontroller.domain.model.RecurringTransaction;
import com.prandini.financecontroller.domain.model.Transaction;
import com.prandini.financecontroller.domain.repository.CreditCardRepository;
import com.prandini.financecontroller.domain.repository.RecurringTransactionRepository;
import com.prandini.financecontroller.domain.repository.TransactionRepository;
import com.prandini.financecontroller.web.dto.RecurringTransactionRequest;
import com.prandini.financecontroller.web.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.YearMonth;
import java.util.List;

@Service
@RequiredArgsConstructor
public class RecurringTransactionService {

    private final RecurringTransactionRepository recurringTransactionRepository;
    private final CreditCardRepository creditCardRepository;
    private final TransactionRepository transactionRepository;

    public List<RecurringTransaction> listAll() {
        return recurringTransactionRepository.findAll(Sort.by(Sort.Direction.ASC, "startDate", "id"));
    }

    @Transactional
    public RecurringTransaction create(RecurringTransactionRequest request) {
        RecurringTransaction recurring = RecurringTransaction.builder()
                .description(request.description())
                .type(request.type())
                .paymentMethod(request.paymentMethod())
                .person(request.person())
                .category(request.category())
                .value(request.value())
                .startDate(request.startDate())
                .endDate(request.endDate())
                .dayOfMonth(request.dayOfMonth() != null ? request.dayOfMonth() : 1)
                .active(request.active() != null ? request.active() : true)
                .baseCompetency(request.baseCompetency())
                .build();

        if (request.creditCardId() != null) {
            CreditCard creditCard = creditCardRepository.findById(request.creditCardId())
                    .orElseThrow(() -> new ResourceNotFoundException("Cartão não encontrado: " + request.creditCardId()));
            recurring.setCreditCard(creditCard);
        }

        return recurringTransactionRepository.save(recurring);
    }

    @Transactional
    public RecurringTransaction update(Long id, RecurringTransactionRequest request) {
        RecurringTransaction recurring = recurringTransactionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Lançamento fixo não encontrado: " + id));

        recurring.setDescription(request.description());
        recurring.setType(request.type());
        recurring.setPaymentMethod(request.paymentMethod());
        recurring.setPerson(request.person());
        recurring.setCategory(request.category());
        recurring.setValue(request.value());
        recurring.setStartDate(request.startDate());
        recurring.setEndDate(request.endDate());
        recurring.setDayOfMonth(request.dayOfMonth() != null ? request.dayOfMonth() : 1);
        recurring.setActive(request.active() != null ? request.active() : true);
        recurring.setBaseCompetency(request.baseCompetency());

        if (request.creditCardId() != null) {
            CreditCard creditCard = creditCardRepository.findById(request.creditCardId())
                    .orElseThrow(() -> new ResourceNotFoundException("Cartão não encontrado: " + request.creditCardId()));
            recurring.setCreditCard(creditCard);
        } else {
            recurring.setCreditCard(null);
        }

        return recurringTransactionRepository.save(recurring);
    }

    @Transactional
    public void delete(Long id) {
        if (!recurringTransactionRepository.existsById(id)) {
            throw new ResourceNotFoundException("Lançamento fixo não encontrado: " + id);
        }
        recurringTransactionRepository.deleteById(id);
    }

    /**
     * Gera transações baseadas nos lançamentos fixos ativos para um mês específico
     */
    @Transactional
    public List<Transaction> generateTransactionsForMonth(String competency) {
        List<RecurringTransaction> activeRecurrings = recurringTransactionRepository.findByActiveTrue();
        List<Transaction> generatedTransactions = new java.util.ArrayList<>();

        // Parse da competência (MM/YYYY)
        String[] parts = competency.split("/");
        int month = Integer.parseInt(parts[0]);
        int year = Integer.parseInt(parts[1]);
        YearMonth yearMonth = YearMonth.of(year, month);

        for (RecurringTransaction recurring : activeRecurrings) {
            // Verificar se está dentro do período
            LocalDate monthStart = yearMonth.atDay(1);
            LocalDate monthEnd = yearMonth.atEndOfMonth();

            if (recurring.getStartDate().isAfter(monthEnd) || 
                (recurring.getEndDate() != null && recurring.getEndDate().isBefore(monthStart))) {
                continue;
            }

            // Calcular a data da transação (dia do mês especificado)
            int day = Math.min(recurring.getDayOfMonth(), yearMonth.lengthOfMonth());
            LocalDate transactionDate = yearMonth.atDay(day);

            // Verificar se a data está dentro do período do lançamento fixo
            if (transactionDate.isBefore(recurring.getStartDate()) || 
                (recurring.getEndDate() != null && transactionDate.isAfter(recurring.getEndDate()))) {
                continue;
            }

            // Criar a transação
            Transaction transaction = Transaction.builder()
                    .date(transactionDate)
                    .type(recurring.getType())
                    .paymentMethod(recurring.getPaymentMethod())
                    .person(recurring.getPerson())
                    .category(recurring.getCategory())
                    .description(recurring.getDescription())
                    .value(recurring.getValue())
                    .competency(competency)
                    .creditCard(recurring.getCreditCard())
                    .installments(1)
                    .installmentNumber(1)
                    .totalInstallments(1)
                    .build();

            generatedTransactions.add(transactionRepository.save(transaction));
        }

        return generatedTransactions;
    }
}

