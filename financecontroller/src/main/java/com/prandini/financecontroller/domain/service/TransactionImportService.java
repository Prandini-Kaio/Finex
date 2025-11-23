package com.prandini.financecontroller.domain.service;

import com.prandini.financecontroller.domain.model.CreditCard;
import com.prandini.financecontroller.domain.model.Transaction;
import com.prandini.financecontroller.domain.model.enums.PaymentMethod;
import com.prandini.financecontroller.domain.model.enums.Person;
import com.prandini.financecontroller.domain.model.enums.TransactionType;
import com.prandini.financecontroller.domain.repository.CreditCardRepository;
import com.prandini.financecontroller.domain.repository.TransactionRepository;
import com.prandini.financecontroller.web.dto.ImportResponse;
import com.prandini.financecontroller.web.dto.ImportTransactionRequest;
import com.prandini.financecontroller.web.dto.TransactionRequest;
import com.prandini.financecontroller.web.util.CsvTransactionParser;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class TransactionImportService {

    private final CsvTransactionParser csvParser;
    private final TransactionService transactionService;
    private final CreditCardRepository creditCardRepository;

    @Transactional
    public ImportResponse importFromCsv(String csvContent) {
        List<ImportTransactionRequest> importRequests = csvParser.parseCsv(csvContent);
        List<String> errors = new ArrayList<>();
        int successCount = 0;

        for (int i = 0; i < importRequests.size(); i++) {
            ImportTransactionRequest importRequest = importRequests.get(i);
            try {
                TransactionRequest transactionRequest = convertToTransactionRequest(importRequest);
                transactionService.create(transactionRequest);
                successCount++;
            } catch (Exception e) {
                errors.add(String.format("Linha %d: %s", i + 2, e.getMessage())); // +2 porque linha 1 é cabeçalho
            }
        }

        return new ImportResponse(
                importRequests.size(),
                successCount,
                errors.size(),
                errors
        );
    }

    private TransactionRequest convertToTransactionRequest(ImportTransactionRequest importRequest) {
        // Valida e converte enums
        TransactionType type = parseTransactionType(importRequest.type());
        PaymentMethod paymentMethod = parsePaymentMethod(importRequest.paymentMethod());
        Person person = parsePerson(importRequest.person());

        // Busca cartão de crédito se fornecido
        Long creditCardId = null;
        if (importRequest.creditCardName() != null && !importRequest.creditCardName().isEmpty()) {
            creditCardId = findCreditCardByName(importRequest.creditCardName());
        }

        // Processa parcelas
        Integer installments = importRequest.installments() != null && importRequest.installments() > 1
                ? importRequest.installments() : 1;
        Integer installmentNumber = 1;
        Integer totalInstallments = installments;
        Long parentPurchaseId = null;

        return new TransactionRequest(
                importRequest.date(),
                type,
                paymentMethod,
                person,
                importRequest.category(),
                importRequest.description(),
                importRequest.value(),
                importRequest.competency(),
                creditCardId,
                installments,
                installmentNumber,
                totalInstallments,
                parentPurchaseId
        );
    }

    private TransactionType parseTransactionType(String type) {
        try {
            // Tenta usar o método fromLabel primeiro (aceita "Despesa" ou "Receita")
            return TransactionType.fromLabel(type.trim());
        } catch (IllegalArgumentException e) {
            // Se falhar, tenta usar valueOf (aceita "DESPESA" ou "RECEITA")
            try {
                return TransactionType.valueOf(type.trim().toUpperCase());
            } catch (IllegalArgumentException e2) {
                throw new IllegalArgumentException("Tipo inválido: " + type + ". Use 'Despesa' ou 'Receita'");
            }
        }
    }

    private PaymentMethod parsePaymentMethod(String method) {
        try {
            // Tenta usar o método fromLabel primeiro
            return PaymentMethod.fromLabel(method.trim());
        } catch (IllegalArgumentException e) {
            // Se falhar, tenta usar valueOf
            try {
                return PaymentMethod.valueOf(method.trim().toUpperCase());
            } catch (IllegalArgumentException e2) {
                throw new IllegalArgumentException("Método de pagamento inválido: " + method + ". Use 'Crédito', 'Débito', 'PIX' ou 'Dinheiro'");
            }
        }
    }

    private Person parsePerson(String person) {
        try {
            // Tenta usar o método fromLabel primeiro
            return Person.fromLabel(person.trim());
        } catch (IllegalArgumentException e) {
            // Se falhar, tenta usar valueOf
            try {
                return Person.valueOf(person.trim().toUpperCase());
            } catch (IllegalArgumentException e2) {
                throw new IllegalArgumentException("Pessoa inválida: " + person + ". Use 'Kaio', 'Gabriela' ou 'Ambos'");
            }
        }
    }

    private Long findCreditCardByName(String cardName) {
        return creditCardRepository.findAll().stream()
                .filter(card -> card.getName().equalsIgnoreCase(cardName.trim()))
                .findFirst()
                .map(CreditCard::getId)
                .orElseThrow(() -> new IllegalArgumentException("Cartão de crédito não encontrado: " + cardName));
    }
}

