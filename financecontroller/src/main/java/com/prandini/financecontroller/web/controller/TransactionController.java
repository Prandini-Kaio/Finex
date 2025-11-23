package com.prandini.financecontroller.web.controller;

import com.prandini.financecontroller.domain.service.TransactionImportService;
import com.prandini.financecontroller.domain.service.TransactionService;
import com.prandini.financecontroller.web.dto.ImportResponse;
import com.prandini.financecontroller.web.dto.TransactionRequest;
import com.prandini.financecontroller.web.dto.TransactionResponse;
import com.prandini.financecontroller.web.mapper.FinanceMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.List;

@RestController
@RequestMapping("/api/transactions")
@RequiredArgsConstructor
public class TransactionController {

    private final TransactionService transactionService;
    private final TransactionImportService importService;

    @GetMapping
    public List<TransactionResponse> listTransactions() {
        return transactionService.listAll().stream()
                .map(FinanceMapper::toResponse)
                .toList();
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public TransactionResponse createTransaction(@RequestBody TransactionRequest request) {
        return FinanceMapper.toResponse(transactionService.create(request));
    }

    @PostMapping(value = "/import", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @ResponseStatus(HttpStatus.OK)
    public ImportResponse importTransactions(@RequestParam("file") MultipartFile file) {
        try {
            String csvContent = new String(file.getBytes(), StandardCharsets.UTF_8);
            return importService.importFromCsv(csvContent);
        } catch (IOException e) {
            throw new RuntimeException("Erro ao ler arquivo CSV: " + e.getMessage(), e);
        }
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteTransaction(@PathVariable Long id) {
        transactionService.delete(id);
    }
}

