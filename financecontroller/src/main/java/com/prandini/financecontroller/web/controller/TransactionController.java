package com.prandini.financecontroller.web.controller;

import com.prandini.financecontroller.domain.service.TransactionImportService;
import com.prandini.financecontroller.domain.service.TransactionService;
import com.prandini.financecontroller.web.dto.ImportResponse;
import com.prandini.financecontroller.web.dto.TransactionRequest;
import com.prandini.financecontroller.web.dto.TransactionResponse;
import com.prandini.financecontroller.web.mapper.FinanceMapper;
import com.prandini.financecontroller.web.util.CsvTransactionExporter;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;

@RestController
@RequestMapping("/api/transactions")
@RequiredArgsConstructor
public class TransactionController {

    private final TransactionService transactionService;
    private final TransactionImportService importService;
    private final CsvTransactionExporter csvExporter;

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

    @GetMapping(value = "/export", produces = MediaType.TEXT_PLAIN_VALUE)
    public ResponseEntity<String> exportTransactions(
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate) {
        
        List<com.prandini.financecontroller.domain.model.Transaction> transactions;
        String filename = "lancamentos_exportados.csv";
        
        if (startDate != null || endDate != null) {
            // Filtro por período
            LocalDate start = startDate != null ? LocalDate.parse(startDate, DateTimeFormatter.ISO_LOCAL_DATE) : null;
            LocalDate end = endDate != null ? LocalDate.parse(endDate, DateTimeFormatter.ISO_LOCAL_DATE) : null;
            transactions = transactionService.listByDateRange(start, end);
            
            // Ajusta o nome do arquivo com o período
            if (start != null && end != null) {
                filename = String.format("lancamentos_%s_a_%s.csv", 
                    start.format(DateTimeFormatter.ofPattern("yyyy-MM-dd")),
                    end.format(DateTimeFormatter.ofPattern("yyyy-MM-dd")));
            } else if (start != null) {
                filename = String.format("lancamentos_de_%s.csv", 
                    start.format(DateTimeFormatter.ofPattern("yyyy-MM-dd")));
            } else if (end != null) {
                filename = String.format("lancamentos_ate_%s.csv", 
                    end.format(DateTimeFormatter.ofPattern("yyyy-MM-dd")));
            }
        } else {
            // Todos os lançamentos
            transactions = transactionService.listAll();
        }
        
        String csvContent = csvExporter.exportToCsv(transactions);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.parseMediaType("text/csv;charset=UTF-8"));
        headers.setContentDispositionFormData("attachment", filename);

        return ResponseEntity.ok()
                .headers(headers)
                .body(csvContent);
    }
}

