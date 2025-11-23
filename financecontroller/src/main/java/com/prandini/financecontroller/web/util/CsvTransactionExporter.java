package com.prandini.financecontroller.web.util;

import com.prandini.financecontroller.domain.model.Transaction;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Component
public class CsvTransactionExporter {

    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("dd/MM/yyyy");
    private static final String CSV_HEADER = "data,tipo,metodoPagamento,pessoa,categoria,descricao,valor,competencia,cartaoCredito,parcelas";

    public String exportToCsv(List<Transaction> transactions) {
        StringBuilder csv = new StringBuilder();
        csv.append(CSV_HEADER).append("\n");

        for (Transaction transaction : transactions) {
            csv.append(formatTransaction(transaction)).append("\n");
        }

        return csv.toString();
    }

    private String formatTransaction(Transaction transaction) {
        StringBuilder line = new StringBuilder();

        // Data (DD/MM/YYYY)
        line.append(transaction.getDate().format(DATE_FORMATTER)).append(",");

        // Tipo (usa getLabel() para retornar "Despesa" ou "Receita")
        line.append(transaction.getType().getLabel()).append(",");

        // Método de Pagamento (usa getLabel() para retornar "Crédito", "Débito", etc.)
        line.append(transaction.getPaymentMethod().getLabel()).append(",");

        // Pessoa (usa getLabel() para retornar "Kaio", "Gabriela", "Ambos")
        line.append(transaction.getPerson().getLabel()).append(",");

        // Categoria
        line.append(escapeCsvField(transaction.getCategory())).append(",");

        // Descrição
        line.append(escapeCsvField(transaction.getDescription())).append(",");

        // Valor (usando ponto como separador decimal)
        line.append(transaction.getValue().toString()).append(",");

        // Competência
        line.append(transaction.getCompetency()).append(",");

        // Cartão de Crédito (nome do cartão ou vazio)
        String creditCardName = transaction.getCreditCard() != null 
            ? transaction.getCreditCard().getName() 
            : "";
        line.append(escapeCsvField(creditCardName)).append(",");

        // Parcelas (total de parcelas, não o número da parcela atual)
        Integer installments = transaction.getTotalInstallments() != null 
            ? transaction.getTotalInstallments() 
            : (transaction.getInstallments() != null ? transaction.getInstallments() : 1);
        line.append(installments);

        return line.toString();
    }

    private String escapeCsvField(String field) {
        if (field == null) {
            return "";
        }
        // Se o campo contém vírgula, aspas ou quebra de linha, envolve em aspas e escapa aspas internas
        if (field.contains(",") || field.contains("\"") || field.contains("\n")) {
            return "\"" + field.replace("\"", "\"\"") + "\"";
        }
        return field;
    }
}

