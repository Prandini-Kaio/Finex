package com.prandini.financecontroller.domain.service;

import com.prandini.financecontroller.domain.model.Budget;
import com.prandini.financecontroller.domain.model.Transaction;
import com.prandini.financecontroller.domain.model.enums.BudgetType;
import com.prandini.financecontroller.domain.model.enums.TransactionType;
import com.prandini.financecontroller.domain.repository.BudgetRepository;
import com.prandini.financecontroller.domain.repository.TransactionRepository;
import com.prandini.financecontroller.web.dto.BudgetRequest;
import com.prandini.financecontroller.web.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;

@Service
@RequiredArgsConstructor
public class BudgetService {

    private final BudgetRepository budgetRepository;
    private final TransactionRepository transactionRepository;

    public List<Budget> listAll() {
        return budgetRepository.findAll(Sort.by("competency", "category"));
    }

    @Transactional
    public Budget create(BudgetRequest request) {
        BigDecimal finalAmount = request.amount();
        BigDecimal percentage = request.percentage();

        // Se for por porcentagem, calcular o valor baseado nas receitas da pessoa
        if (request.budgetType() == BudgetType.PERCENTAGE && percentage != null) {
            BigDecimal totalIncome = calculateTotalIncome(request.competency(), request.person());
            finalAmount = totalIncome.multiply(percentage).divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
        }

        Budget budget = Budget.builder()
                .competency(request.competency())
                .category(request.category())
                .person(request.person())
                .budgetType(request.budgetType() != null ? request.budgetType() : BudgetType.VALUE)
                .amount(finalAmount)
                .percentage(percentage)
                .build();
        return budgetRepository.save(budget);
    }

    private BigDecimal calculateTotalIncome(String competency, com.prandini.financecontroller.domain.model.enums.Person person) {
        List<Transaction> transactions = transactionRepository.findByCompetencyAndType(competency, TransactionType.RECEITA);
        
        if (person == com.prandini.financecontroller.domain.model.enums.Person.AMBOS) {
            // Para "Ambos", somar todas as receitas (Kaio, Gabriela e Ambos sem dividir)
            return transactions.stream()
                    .map(Transaction::getValue)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);
        } else {
            // Para pessoa específica, incluir suas receitas + metade das receitas "Ambos"
            return transactions.stream()
                    .filter(t -> {
                        // Incluir transações da pessoa ou "Ambos"
                        if (t.getPerson() == person) {
                            return true;
                        }
                        if (t.getPerson() == com.prandini.financecontroller.domain.model.enums.Person.AMBOS) {
                            return true;
                        }
                        return false;
                    })
                    .map(t -> {
                        // Se for "Ambos", dividir por 2
                        if (t.getPerson() == com.prandini.financecontroller.domain.model.enums.Person.AMBOS) {
                            return t.getValue().divide(BigDecimal.valueOf(2), 2, RoundingMode.HALF_UP);
                        }
                        return t.getValue();
                    })
                    .reduce(BigDecimal.ZERO, BigDecimal::add);
        }
    }

    @Transactional
    public void delete(Long id) {
        if (!budgetRepository.existsById(id)) {
            throw new ResourceNotFoundException("Orçamento não encontrado: " + id);
        }
        budgetRepository.deleteById(id);
    }
}

