package com.prandini.financecontroller.web.controller;

import com.prandini.financecontroller.domain.service.InvestmentService;
import com.prandini.financecontroller.web.dto.InvestmentRequest;
import com.prandini.financecontroller.web.dto.InvestmentResponse;
import com.prandini.financecontroller.web.mapper.FinanceMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/investments")
@RequiredArgsConstructor
public class InvestmentController {

    private final InvestmentService investmentService;

    @GetMapping
    public List<InvestmentResponse> listInvestments() {
        return investmentService.listAll().stream()
                .map(FinanceMapper::toResponse)
                .toList();
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public InvestmentResponse createInvestment(@RequestBody InvestmentRequest request) {
        return FinanceMapper.toResponse(investmentService.create(request));
    }

    @PutMapping("/{id}")
    @ResponseStatus(HttpStatus.OK)
    public InvestmentResponse updateInvestment(@PathVariable Long id, @RequestBody InvestmentRequest request) {
        return FinanceMapper.toResponse(investmentService.update(id, request));
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteInvestment(@PathVariable Long id) {
        investmentService.delete(id);
    }
}

