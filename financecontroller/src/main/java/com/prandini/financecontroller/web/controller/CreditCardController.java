package com.prandini.financecontroller.web.controller;

import com.prandini.financecontroller.domain.service.CreditCardService;
import com.prandini.financecontroller.web.dto.CreditCardRequest;
import com.prandini.financecontroller.web.dto.CreditCardResponse;
import com.prandini.financecontroller.web.mapper.FinanceMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/credit-cards")
@RequiredArgsConstructor
public class CreditCardController {

    private final CreditCardService creditCardService;

    @GetMapping
    public List<CreditCardResponse> listCards() {
        return creditCardService.listAll().stream()
                .map(FinanceMapper::toResponse)
                .toList();
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public CreditCardResponse createCard(@RequestBody CreditCardRequest request) {
        return FinanceMapper.toResponse(creditCardService.create(request));
    }

    @PutMapping("/{id}")
    public CreditCardResponse updateCard(@PathVariable Long id, @RequestBody CreditCardRequest request) {
        return FinanceMapper.toResponse(creditCardService.update(id, request));
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteCard(@PathVariable Long id) {
        creditCardService.delete(id);
    }
}

