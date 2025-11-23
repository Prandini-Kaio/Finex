package com.prandini.financecontroller.domain.service;

import com.prandini.financecontroller.domain.model.SavingsDeposit;
import com.prandini.financecontroller.domain.model.SavingsGoal;
import com.prandini.financecontroller.domain.repository.SavingsGoalRepository;
import com.prandini.financecontroller.web.dto.DepositRequest;
import com.prandini.financecontroller.web.dto.SavingsGoalRequest;
import com.prandini.financecontroller.web.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

@Service
@RequiredArgsConstructor
public class SavingsGoalService {

    private final SavingsGoalRepository savingsGoalRepository;

    public List<SavingsGoal> listAll() {
        return savingsGoalRepository.findAll();
    }

    @Transactional
    public SavingsGoal create(SavingsGoalRequest request) {
        SavingsGoal goal = SavingsGoal.builder()
                .name(request.name())
                .targetAmount(request.targetAmount())
                .currentAmount(BigDecimal.ZERO)
                .deadline(request.deadline())
                .owner(request.owner())
                .description(request.description())
                .build();
        return savingsGoalRepository.save(goal);
    }

    @Transactional
    public void delete(Long id) {
        if (!savingsGoalRepository.existsById(id)) {
            throw new ResourceNotFoundException("Objetivo não encontrado: " + id);
        }
        savingsGoalRepository.deleteById(id);
    }

    @Transactional
    public SavingsGoal addDeposit(Long goalId, DepositRequest request) {
        SavingsGoal goal = savingsGoalRepository.findById(goalId)
                .orElseThrow(() -> new ResourceNotFoundException("Objetivo não encontrado: " + goalId));
        SavingsDeposit deposit = SavingsDeposit.builder()
                .amount(request.amount())
                .date(request.date())
                .person(request.person())
                .build();
        goal.addDeposit(deposit);
        return savingsGoalRepository.save(goal);
    }
}

