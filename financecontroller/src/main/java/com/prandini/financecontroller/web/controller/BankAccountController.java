package com.prandini.financecontroller.web.controller;

import com.prandini.financecontroller.domain.service.BankAccountService;
import com.prandini.financecontroller.web.dto.BankAccountRequest;
import com.prandini.financecontroller.web.dto.BankAccountResponse;
import com.prandini.financecontroller.web.mapper.FinanceMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/bank-accounts")
@RequiredArgsConstructor
public class BankAccountController {

    private final BankAccountService bankAccountService;

    @GetMapping
    public List<BankAccountResponse> listAccounts(@RequestParam(required = false) Long ownerId) {
        var accounts = ownerId != null ? bankAccountService.listByOwner(ownerId) : bankAccountService.listAll();
        return accounts.stream().map(FinanceMapper::toResponse).toList();
    }

    @GetMapping("/{id}")
    public BankAccountResponse getAccount(@PathVariable Long id) {
        return FinanceMapper.toResponse(bankAccountService.getById(id));
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public BankAccountResponse createAccount(@RequestBody BankAccountRequest request) {
        return FinanceMapper.toResponse(bankAccountService.create(request));
    }

    @PutMapping("/{id}")
    public BankAccountResponse updateAccount(@PathVariable Long id, @RequestBody BankAccountRequest request) {
        return FinanceMapper.toResponse(bankAccountService.update(id, request));
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteAccount(@PathVariable Long id) {
        bankAccountService.delete(id);
    }
}
