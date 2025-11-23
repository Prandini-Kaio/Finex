package com.prandini.financecontroller.web.util;

import com.prandini.financecontroller.web.dto.ImportTransactionRequest;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.ArrayList;
import java.util.List;

@Component
public class CsvTransactionParser {

    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("dd/MM/yyyy");
    private static final DateTimeFormatter DATE_FORMATTER_ALT = DateTimeFormatter.ofPattern("yyyy-MM-dd");

    public List<ImportTransactionRequest> parseCsv(String csvContent) {
        List<ImportTransactionRequest> transactions = new ArrayList<>();
        String[] lines = csvContent.split("\n");

        // Pula o cabeçalho se existir
        int startIndex = 0;
        if (lines.length > 0 && lines[0].toLowerCase().contains("data")) {
            startIndex = 1;
        }

        for (int i = startIndex; i < lines.length; i++) {
            String line = lines[i].trim();
            if (line.isEmpty()) continue;

            try {
                ImportTransactionRequest transaction = parseLine(line);
                if (transaction != null) {
                    transactions.add(transaction);
                }
            } catch (Exception e) {
                // Ignora linhas com erro, mas poderia logar
                System.err.println("Erro ao processar linha " + (i + 1) + ": " + e.getMessage());
            }
        }

        return transactions;
    }

    private ImportTransactionRequest parseLine(String line) {
        // Suporta CSV com vírgula ou ponto e vírgula como separador
        String[] fields = line.contains(";") ? line.split(";") : line.split(",");

        if (fields.length < 7) {
            throw new IllegalArgumentException("Linha incompleta. Esperado pelo menos 7 campos.");
        }

        // Remove aspas dos campos se existirem
        for (int i = 0; i < fields.length; i++) {
            fields[i] = fields[i].trim().replaceAll("^\"|\"$", "");
        }

        LocalDate date = parseDate(fields[0]);
        String type = fields[1].trim();
        String paymentMethod = fields[2].trim();
        String person = fields[3].trim();
        String category = fields[4].trim();
        String description = fields[5].trim();
        BigDecimal value = parseValue(fields[6]);
        String competency = fields.length > 7 ? fields[7].trim() : formatCompetency(date);
        String creditCardName = fields.length > 8 && !fields[8].trim().isEmpty() ? fields[8].trim() : null;
        Integer installments = fields.length > 9 && !fields[9].trim().isEmpty() ? parseInt(fields[9].trim()) : 1;

        return new ImportTransactionRequest(
                date,
                type,
                paymentMethod,
                person,
                category,
                description,
                value,
                competency,
                creditCardName,
                installments
        );
    }

    private LocalDate parseDate(String dateStr) {
        try {
            return LocalDate.parse(dateStr, DATE_FORMATTER);
        } catch (DateTimeParseException e) {
            try {
                return LocalDate.parse(dateStr, DATE_FORMATTER_ALT);
            } catch (DateTimeParseException e2) {
                throw new IllegalArgumentException("Data inválida: " + dateStr + ". Use formato DD/MM/YYYY ou YYYY-MM-DD");
            }
        }
    }

    private BigDecimal parseValue(String valueStr) {
        try {
            // Remove espaços e formata para aceitar vírgula ou ponto como separador decimal
            String cleaned = valueStr.trim().replace(",", ".");
            return new BigDecimal(cleaned);
        } catch (NumberFormatException e) {
            throw new IllegalArgumentException("Valor inválido: " + valueStr);
        }
    }

    private Integer parseInt(String intStr) {
        try {
            return Integer.parseInt(intStr.trim());
        } catch (NumberFormatException e) {
            return 1;
        }
    }

    private String formatCompetency(LocalDate date) {
        return String.format("%02d/%04d", date.getMonthValue(), date.getYear());
    }
}


