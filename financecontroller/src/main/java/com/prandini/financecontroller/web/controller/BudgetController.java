package com.prandini.financecontroller.web.controller;

import com.prandini.financecontroller.domain.service.BudgetService;
import com.prandini.financecontroller.web.dto.BudgetRequest;
import com.prandini.financecontroller.web.dto.BudgetResponse;
import com.prandini.financecontroller.web.mapper.FinanceMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/budgets")
@RequiredArgsConstructor
public class BudgetController {

    private final BudgetService budgetService;

    @GetMapping
    public List<BudgetResponse> listBudgets() {
        return budgetService.listAll().stream()
                .map(FinanceMapper::toResponse)
                .toList();
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public BudgetResponse createBudget(@RequestBody BudgetRequest request) {
        return FinanceMapper.toResponse(budgetService.create(request));
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteBudget(@PathVariable Long id) {
        budgetService.delete(id);
    }
}

