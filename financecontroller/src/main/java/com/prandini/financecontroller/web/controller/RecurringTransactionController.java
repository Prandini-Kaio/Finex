package com.prandini.financecontroller.web.controller;

import com.prandini.financecontroller.domain.model.RecurringTransaction;
import com.prandini.financecontroller.domain.model.Transaction;
import com.prandini.financecontroller.domain.service.RecurringTransactionService;
import com.prandini.financecontroller.web.dto.RecurringTransactionRequest;
import com.prandini.financecontroller.web.dto.RecurringTransactionResponse;
import com.prandini.financecontroller.web.mapper.FinanceMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/recurring-transactions")
@RequiredArgsConstructor
public class RecurringTransactionController {

    private final RecurringTransactionService recurringTransactionService;

    @GetMapping
    public List<RecurringTransactionResponse> listAll() {
        return recurringTransactionService.listAll().stream()
                .map(FinanceMapper::toRecurringTransactionResponse)
                .toList();
    }

    @PostMapping
    public RecurringTransactionResponse create(@RequestBody RecurringTransactionRequest request) {
        RecurringTransaction created = recurringTransactionService.create(request);
        return FinanceMapper.toRecurringTransactionResponse(created);
    }

    @PutMapping("/{id}")
    public RecurringTransactionResponse update(@PathVariable Long id, @RequestBody RecurringTransactionRequest request) {
        RecurringTransaction updated = recurringTransactionService.update(id, request);
        return FinanceMapper.toRecurringTransactionResponse(updated);
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable Long id) {
        recurringTransactionService.delete(id);
    }

    @PostMapping("/generate")
    public List<Transaction> generateForMonth(@RequestParam("competency") String competency) {
        return recurringTransactionService.generateTransactionsForMonth(competency);
    }
}

