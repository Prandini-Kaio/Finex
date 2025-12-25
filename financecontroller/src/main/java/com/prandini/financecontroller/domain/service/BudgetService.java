package com.prandini.financecontroller.domain.service;

import com.prandini.financecontroller.domain.model.Budget;
import com.prandini.financecontroller.domain.model.Person;
import com.prandini.financecontroller.domain.model.Transaction;
import com.prandini.financecontroller.domain.model.enums.BudgetType;
import com.prandini.financecontroller.domain.model.enums.TransactionType;
import com.prandini.financecontroller.domain.repository.BudgetRepository;
import com.prandini.financecontroller.domain.repository.PersonRepository;
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
    private final PersonRepository personRepository;

    public List<Budget> listAll() {
        return budgetRepository.findAll(Sort.by("competency", "category"));
    }

    @Transactional
    public Budget create(BudgetRequest request) {
        Person person = personRepository.findById(request.personId())
                .orElseThrow(() -> new ResourceNotFoundException("Pessoa não encontrada: " + request.personId()));
        
        BigDecimal finalAmount = request.amount();
        BigDecimal percentage = request.percentage();

        if (request.budgetType() == BudgetType.PERCENTAGE && percentage != null) {
            BigDecimal totalIncome = calculateTotalIncome(request.competency(), person);
            finalAmount = totalIncome.multiply(percentage).divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
        }

        Budget budget = Budget.builder()
                .competency(request.competency())
                .category(request.category())
                .person(person)
                .budgetType(request.budgetType() != null ? request.budgetType() : BudgetType.VALUE)
                .amount(finalAmount)
                .percentage(percentage)
                .build();
        return budgetRepository.save(budget);
    }

    private BigDecimal calculateTotalIncome(String competency, Person person) {
        List<Transaction> transactions = transactionRepository.findByCompetencyAndType(competency, TransactionType.RECEITA);
        Person ambosPerson = personRepository.findByName("Ambos").orElse(null);
        
        if (ambosPerson != null && person.getId().equals(ambosPerson.getId())) {
            return transactions.stream()
                    .map(Transaction::getValue)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);
        } else {
            return transactions.stream()
                    .filter(t -> {
                        if (t.getPerson() == null) return false;
                        if (t.getPerson().getId().equals(person.getId())) {
                            return true;
                        }
                        if (ambosPerson != null && t.getPerson().getId().equals(ambosPerson.getId())) {
                            return true;
                        }
                        return false;
                    })
                    .map(t -> {
                        if (ambosPerson != null && t.getPerson().getId().equals(ambosPerson.getId())) {
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

