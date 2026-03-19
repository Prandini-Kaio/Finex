package com.prandini.financecontroller.domain.service;

import com.prandini.financecontroller.domain.model.Budget;
import com.prandini.financecontroller.domain.model.Person;
import com.prandini.financecontroller.domain.model.PersonSplit;
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
import java.util.Comparator;
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

        BigDecimal total = BigDecimal.ZERO;
        for (Transaction transaction : transactions) {
            if (transaction.getPerson() == null) {
                continue;
            }

            Person transactionPerson = transaction.getPerson();
            if (transactionPerson.getId().equals(person.getId())) {
                total = total.add(transaction.getValue());
                continue;
            }

            if (Boolean.TRUE.equals(transactionPerson.getAllowSplit())) {
                total = total.add(allocateShare(transaction.getValue(), transactionPerson, person.getId()));
            }
        }

        return total;
    }

    private BigDecimal allocateShare(BigDecimal value, Person distributor, Long targetPersonId) {
        if (value == null) {
            return BigDecimal.ZERO;
        }
        if (distributor.getSplits() == null || distributor.getSplits().isEmpty()) {
            return BigDecimal.ZERO;
        }

        BigDecimal scaledValue = value.setScale(2, RoundingMode.HALF_UP);
        List<PersonSplit> orderedSplits = distributor.getSplits().stream()
                .sorted(Comparator.comparing(split -> split.getId().getSplitWithPersonId()))
                .toList();

        BigDecimal allocatedSum = BigDecimal.ZERO;
        BigDecimal targetShare = BigDecimal.ZERO;

        for (int i = 0; i < orderedSplits.size(); i++) {
            PersonSplit split = orderedSplits.get(i);
            Long recipientId = split.getId().getSplitWithPersonId();
            if (i < orderedSplits.size() - 1) {
                BigDecimal share = scaledValue
                        .multiply(split.getPercentage())
                        .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
                allocatedSum = allocatedSum.add(share);
                if (recipientId.equals(targetPersonId)) {
                    targetShare = share;
                }
            } else {
                BigDecimal residual = scaledValue.subtract(allocatedSum).setScale(2, RoundingMode.HALF_UP);
                if (recipientId.equals(targetPersonId)) {
                    targetShare = residual;
                }
            }
        }

        return targetShare;
    }

    @Transactional
    public void delete(Long id) {
        if (!budgetRepository.existsById(id)) {
            throw new ResourceNotFoundException("Orçamento não encontrado: " + id);
        }
        budgetRepository.deleteById(id);
    }
}

