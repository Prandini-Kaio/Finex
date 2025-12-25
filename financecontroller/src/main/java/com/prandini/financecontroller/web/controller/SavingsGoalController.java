package com.prandini.financecontroller.web.controller;

import com.prandini.financecontroller.domain.service.SavingsGoalService;
import com.prandini.financecontroller.web.dto.DepositRequest;
import com.prandini.financecontroller.web.dto.SavingsGoalRequest;
import com.prandini.financecontroller.web.dto.SavingsGoalResponse;
import com.prandini.financecontroller.web.dto.SavingsDepositResponse;
import com.prandini.financecontroller.web.mapper.FinanceMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/savings-goals")
@RequiredArgsConstructor
public class SavingsGoalController {

    private final SavingsGoalService savingsGoalService;

    @GetMapping
    public List<SavingsGoalResponse> listGoals() {
        return savingsGoalService.listAll().stream()
                .map(FinanceMapper::toResponse)
                .toList();
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public SavingsGoalResponse createGoal(@RequestBody SavingsGoalRequest request) {
        return FinanceMapper.toResponse(savingsGoalService.create(request));
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteGoal(@PathVariable Long id) {
        savingsGoalService.delete(id);
    }

    @PostMapping("/{id}/deposits")
    public SavingsGoalResponse addDeposit(@PathVariable Long id, @RequestBody DepositRequest request) {
        return FinanceMapper.toResponse(savingsGoalService.addDeposit(id, request));
    }

    @GetMapping("/deposits")
    public List<SavingsDepositResponse> listAllDeposits() {
        return savingsGoalService.listAllDeposits().stream()
                .map(FinanceMapper::toResponse)
                .toList();
    }
}

