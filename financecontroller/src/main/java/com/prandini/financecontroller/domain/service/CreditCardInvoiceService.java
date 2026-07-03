package com.prandini.financecontroller.domain.service;

import com.prandini.financecontroller.domain.model.BankAccount;
import com.prandini.financecontroller.domain.model.CreditCard;
import com.prandini.financecontroller.domain.model.CreditCardInvoice;
import com.prandini.financecontroller.domain.model.Person;
import com.prandini.financecontroller.domain.model.Transaction;
import com.prandini.financecontroller.domain.model.enums.PaymentMethod;
import com.prandini.financecontroller.domain.model.enums.TransactionType;
import com.prandini.financecontroller.domain.repository.BankAccountRepository;
import com.prandini.financecontroller.domain.repository.CreditCardInvoiceRepository;
import com.prandini.financecontroller.domain.repository.CreditCardRepository;
import com.prandini.financecontroller.domain.repository.TransactionRepository;
import com.prandini.financecontroller.web.dto.CreditCardInvoiceReceiptResponse;
import com.prandini.financecontroller.web.dto.CreditCardInvoiceRequest;
import com.prandini.financecontroller.web.dto.CreditCardInvoiceResponse;
import com.prandini.financecontroller.web.dto.PayAllCreditCardInvoicesRequest;
import com.prandini.financecontroller.web.dto.TransactionRequest;
import com.prandini.financecontroller.web.exception.BadRequestException;
import com.prandini.financecontroller.web.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CreditCardInvoiceService {

    private static final String PAYMENT_CATEGORY = "Cartão de Crédito";

    private final CreditCardInvoiceRepository invoiceRepository;
    private final CreditCardRepository creditCardRepository;
    private final TransactionRepository transactionRepository;
    private final BankAccountRepository bankAccountRepository;
    private final TransactionService transactionService;
    private final BankAccountService bankAccountService;

    @Transactional(readOnly = true)
    public List<CreditCardInvoiceResponse> listByMonth(String referenceMonth) {
        validateReferenceMonth(referenceMonth);

        List<CreditCard> cards = creditCardRepository.findAll(Sort.by("name"));
        Map<Long, CreditCardInvoice> invoicesByCard = invoiceRepository.findByReferenceMonth(referenceMonth).stream()
                .collect(Collectors.toMap(invoice -> invoice.getCreditCard().getId(), Function.identity()));

        return cards.stream()
                .map(card -> toResponse(card, invoicesByCard.get(card.getId()), referenceMonth))
                .toList();
    }

    @Transactional(readOnly = true)
    public CreditCardInvoiceReceiptResponse getReceipt(Long cardId, String referenceMonth) {
        validateReferenceMonth(referenceMonth);
        CreditCard card = creditCardRepository.findById(cardId)
                .orElseThrow(() -> new ResourceNotFoundException("Cartão não encontrado: " + cardId));

        CreditCardInvoice invoice = invoiceRepository.findByCreditCardIdAndReferenceMonth(cardId, referenceMonth)
                .orElseThrow(() -> new ResourceNotFoundException("Fatura não encontrada para o mês informado"));

        if (!invoice.isPaid()) {
            throw new BadRequestException("Fatura ainda não foi paga");
        }

        return buildReceipt(card, invoice, referenceMonth);
    }

    @Transactional
    public CreditCardInvoiceResponse updateStatus(Long cardId, CreditCardInvoiceRequest request) {
        validateReferenceMonth(request.referenceMonth());
        if (request.paid() == null) {
            throw new BadRequestException("O indicador de pagamento é obrigatório");
        }

        CreditCard card = creditCardRepository.findById(cardId)
                .orElseThrow(() -> new ResourceNotFoundException("Cartão não encontrado: " + cardId));

        CreditCardInvoice invoice = invoiceRepository.findByCreditCardIdAndReferenceMonth(cardId, request.referenceMonth())
                .orElseGet(() -> CreditCardInvoice.builder()
                        .creditCard(card)
                        .referenceMonth(request.referenceMonth())
                        .paid(false)
                        .build());

        applyPaymentState(invoice, card, request.referenceMonth(), request.paid(), request.bankAccountId());

        CreditCardInvoice saved = invoiceRepository.save(invoice);
        return toResponse(card, saved, request.referenceMonth());
    }

    @Transactional
    public List<CreditCardInvoiceResponse> updateAllStatus(PayAllCreditCardInvoicesRequest request) {
        validateReferenceMonth(request.referenceMonth());
        if (request.paid() == null) {
            throw new BadRequestException("O indicador de pagamento é obrigatório");
        }

        List<CreditCard> cards = creditCardRepository.findAll(Sort.by("name"));
        if (cards.isEmpty()) {
            return List.of();
        }

        Map<Long, CreditCardInvoice> invoicesByCard = invoiceRepository.findByReferenceMonth(request.referenceMonth()).stream()
                .collect(Collectors.toMap(inv -> inv.getCreditCard().getId(), Function.identity()));

        Map<Long, Long> accountByCard = request.bankAccountIdByCardId() != null
                ? request.bankAccountIdByCardId()
                : Map.of();

        List<CreditCardInvoiceResponse> responses = new ArrayList<>();
        for (CreditCard card : cards) {
            CreditCardInvoice invoice = invoicesByCard.get(card.getId());
            if (invoice == null) {
                invoice = CreditCardInvoice.builder()
                        .creditCard(card)
                        .referenceMonth(request.referenceMonth())
                        .paid(false)
                        .build();
            }
            Long bankAccountId = accountByCard.get(card.getId());
            if (Boolean.TRUE.equals(request.paid()) && bankAccountId == null) {
                bankAccountId = resolveDefaultBankAccountId(card.getOwner().getId());
            }
            applyPaymentState(invoice, card, request.referenceMonth(), request.paid(), bankAccountId);
            CreditCardInvoice saved = invoiceRepository.save(invoice);
            responses.add(toResponse(card, saved, request.referenceMonth()));
        }
        return responses;
    }

    private void applyPaymentState(
            CreditCardInvoice invoice,
            CreditCard card,
            String referenceMonth,
            boolean paid,
            Long bankAccountId) {

        if (paid) {
            if (invoice.isPaid() && invoice.getPaymentTransaction() != null) {
                return;
            }
            BigDecimal amount = calculateInvoiceAmount(card.getId(), referenceMonth);
            if (amount.compareTo(BigDecimal.ZERO) > 0) {
                if (bankAccountId == null) {
                    throw new BadRequestException(
                            "Conta bancária é obrigatória para pagar a fatura de " + card.getName());
                }
                Transaction payment = createPaymentTransaction(card, referenceMonth, amount, bankAccountId);
                invoice.setPaymentTransaction(payment);
            } else {
                invoice.setPaymentTransaction(null);
            }
            invoice.setPaid(true);
            invoice.setPaidAt(LocalDateTime.now());
        } else {
            if (invoice.getPaymentTransaction() != null) {
                transactionService.delete(invoice.getPaymentTransaction().getId());
                invoice.setPaymentTransaction(null);
            }
            invoice.setPaid(false);
            invoice.setPaidAt(null);
        }
    }

    private Transaction createPaymentTransaction(
            CreditCard card,
            String referenceMonth,
            BigDecimal amount,
            Long bankAccountId) {

        Person owner = card.getOwner();
        BankAccount account = bankAccountRepository.findById(bankAccountId)
                .orElseThrow(() -> new ResourceNotFoundException("Conta bancária não encontrada: " + bankAccountId));

        bankAccountService.validateBankAccountAccess(owner, account, TransactionType.DESPESA);

        String description = String.format("Pagamento fatura %s — %s", card.getName(), referenceMonth);

        TransactionRequest paymentRequest = new TransactionRequest(
                LocalDate.now(),
                TransactionType.DESPESA,
                PaymentMethod.DEBITO,
                owner.getId(),
                PAYMENT_CATEGORY,
                description,
                amount,
                null,
                null,
                1,
                1,
                1,
                null,
                bankAccountId
        );

        return transactionService.create(paymentRequest);
    }

    private Long resolveDefaultBankAccountId(Long ownerId) {
        return bankAccountRepository.findByOwnerIdAndActiveTrueOrderByNameAsc(ownerId).stream()
                .findFirst()
                .map(BankAccount::getId)
                .orElse(null);
    }

    private BigDecimal calculateInvoiceAmount(Long cardId, String referenceMonth) {
        BigDecimal sum = transactionRepository.sumByCreditCardAndCompetency(
                cardId, referenceMonth, TransactionType.DESPESA, PaymentMethod.CREDITO);
        return sum != null ? sum : BigDecimal.ZERO;
    }

    private CreditCardInvoiceResponse toResponse(CreditCard card, CreditCardInvoice invoice, String referenceMonth) {
        BigDecimal amount = calculateInvoiceAmount(card.getId(), referenceMonth);
        boolean paid = invoice != null && invoice.isPaid();
        Transaction payment = invoice != null ? invoice.getPaymentTransaction() : null;
        BankAccount account = payment != null ? payment.getBankAccount() : null;

        return new CreditCardInvoiceResponse(
                card.getId(),
                card.getName(),
                card.getOwner() != null ? card.getOwner().getName() : null,
                card.getOwner() != null ? card.getOwner().getId() : null,
                referenceMonth,
                paid,
                paid && invoice != null ? invoice.getPaidAt() : null,
                amount,
                payment != null ? payment.getId() : null,
                account != null ? account.getId() : null,
                account != null ? account.getName() : null
        );
    }

    private CreditCardInvoiceReceiptResponse buildReceipt(
            CreditCard card,
            CreditCardInvoice invoice,
            String referenceMonth) {

        Transaction payment = invoice.getPaymentTransaction();
        BigDecimal amount = calculateInvoiceAmount(card.getId(), referenceMonth);
        BankAccount account = payment != null ? payment.getBankAccount() : null;
        BigDecimal balanceAfter = account != null ? account.getCurrentBalance() : null;

        return new CreditCardInvoiceReceiptResponse(
                card.getId(),
                card.getName(),
                card.getOwner() != null ? card.getOwner().getName() : null,
                referenceMonth,
                amount,
                invoice.getPaidAt(),
                payment != null ? payment.getId() : null,
                account != null ? account.getId() : null,
                account != null ? account.getName() : null,
                balanceAfter,
                payment != null ? payment.getDate() : null,
                payment != null ? payment.getDescription() : null
        );
    }

    private void validateReferenceMonth(String referenceMonth) {
        if (referenceMonth == null || referenceMonth.isBlank()) {
            throw new BadRequestException("O mês de referência é obrigatório");
        }
    }
}
